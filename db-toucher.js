const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const assert = require("assert");

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";

async function createUser(user) {
  user._id = new ObjectID();
  user.questions = [];
  user.answers = [];
  user.comments = [];
  user.rank = 0;

  const client = await connectToDB();
  const db = client.db(dbName);

  try {
    await db.collection("users").insertOne(user);
  } catch (error) {
    throw error;
  }

  client.close();
}

async function getArrayOfDocumentsFromIds(db, collectionName, ids) {
  let queries = [];

  ids.forEach(id => {
    queries.push(db.collection(collectionName).findOne({ _id: id }));
  });

  try {
    return await Promise.all(queries);
  } catch (error) {
    console.log(
      "Problem grabbing documents from array of Ids, currently in grabArrayOfDocumentsFromIds. Here's the error: ",
      error
    );
    throw error;
  }
}

async function deleteUser(user) {
  const client = await connectToDB();
  const db = client.db(dbName);

  //delete user
  await db.collection("users").deleteOne({ _id: user._id });

  //Start with comments, First get a list of documents from the users list of ids
  let comments = await getArrayOfDocumentsFromIds(
    db,
    "comments",
    user.comments
  );
  let commentQueries = [];

  //Make a query to delete every comment
  comments.forEach(comment => {
    commentQueries.push(deleteComment(comment));
  });

  //wait for all comments to be deleted
  console.log("deleting comments");
  try {
    await Promise.all(commentQueries);
  } catch (error) {
    throw error;
  }

  //Now answers, get a list of documents from the users list of ids
  let answers = await getArrayOfDocumentsFromIds(db, "answers", user.answers);
  let answerQueries = [];

  //make "queries to delete answers"
  answers.forEach(answer => {
    answerQueries.push(deleteAnswer(answer));
  });

  //wait to delete answers
  console.log("deleting answers");
  try {
    await Promise.all(answerQueries);
  } catch (error) {
    throw error;
  }

  //Now questions, start by grabbing all of the documents from the users list of ids
  let questions = await getArrayOfDocumentsFromIds(
    db,
    "questions",
    user.questions
  );
  let questionQueries = [];

  questions.forEach(question => {
    questionQueries.push(deleteQuestion(question));
  });

  //wait for questions to be deleted
  console.log("deleting questions");
  try {
    await Promise.all(questionQueries);
  } catch (error) {
    throw error;
  }

  client.close();
}

async function createQuestion(question) {
  const client = await connectToDB();
  const db = client.db(dbName);

  question._id = new ObjectID();

  try {
    await db.collection("questions").insertOne(question);
  } catch (error) {
    throw error;
  }

  let queries = [];

  queries.push(
    db
      .collection("users")
      .updateOne(
        { _id: question.user_id },
        { $addToSet: { questions: question._id } }
      )
  );

  question.tagNames.forEach(tag => {
    queries.push(
      db
        .collection("tags")
        .updateOne({ name: tag }, { $addToSet: { questions: question._id } })
    );
  });

  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }
  client.close();
}

async function deleteQuestion(question) {
  assert(ObjectID.isValid(question._id));

  const client = await connectToDB();
  const db = client.db(dbName);

  let answers = await getArrayOfDocumentsFromIds(
    db,
    "answers",
    question.answers
  );

  //empty query array
  let queries = [];

  //make "queries" to delete all answers
  answers.forEach(answer => {
    queries.push(deleteAnswer(answer));
  });

  //wait for answers to be deleted
  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }

  //delete the question
  try {
    db.collection("questions").deleteOne({ _id: question._id });
  } catch (error) {
    throw error;
  }

  //empty queries array
  queries = [];

  queries.push(
    db
      .collection("users")
      .updateOne(
        { _id: question.user_id },
        { $pull: { questions: question._id } }
      )
  );

  question.tagNames.forEach(tag => {
    queries.push(
      db
        .collection("tags")
        .updateOne({ name: tag }, { $pull: { questions: question._id } })
    );
  });

  //wait for references to be deleted from user and tags
  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }

  client.close();
}

//question id must be  an objectId
async function createAnswer(answer) {
  assert(ObjectID.isValid(answer.question_id));

  const client = await connectToDB();
  const db = client.db(dbName);

  answer._id = new ObjectID();
  answer.voteCount = 0;
  answer.verified = false;

  try {
    await db.collection("answers").insertOne(answer);
  } catch (error) {
    throw error;
  }

  let queries = [];

  queries.push(
    db
      .collection("questions")
      .updateOne(
        { _id: answer.question_id },
        { $push: { answers: answer._id } }
      )
  );

  queries.push(
    db
      .collection("users")
      .updateOne({ _id: answer.user_id }, { $push: { answers: answer._id } })
  );

  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }

  client.close();
}

async function deleteAnswer(answer) {
  assert(ObjectID.isValid(answer.question_id));
  assert(ObjectID.isValid(answer._id));

  const client = await connectToDB();
  const db = client.db(dbName);

  let comments = await getArrayOfDocumentsFromIds(
    db,
    "comments",
    answer.comments
  );

  let queries = [];

  //make "queries" to delete every comment and all it's references
  comments.forEach(comment => {
    queries.push(deleteComment(comment));
  });

  //wait for all the comments to delete
  await Promise.all(queries);

  //Delete the answer
  try {
    await db.collection("answers").deleteOne({ _id: answer._id });
  } catch (error) {
    throw errow;
  }

  //Delete the answers reference in its question.
  queries.push(
    db
      .collection("questions")
      .updateOne(
        { _id: answer.question_id },
        { $pull: { answers: answer._id } }
      )
  );

  //Delete the answers reference in the user that made it.
  queries.push(
    db
      .collection("users")
      .updateOne({ _id: answer.user_id }, { $pull: { answers: answer._id } })
  );

  //Wait for all added queries to complete.
  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }

  client.close();
}

async function createComment(comment) {
  assert(ObjectID.isValid(comment.answer_id));

  const client = await connectToDB();
  const db = client.db(dbName);

  comment._id = new ObjectID();

  try {
    await db.collection("comments").insertOne(comment);
  } catch (error) {
    throw error;
  }

  let queries = [];

  queries.push(
    db
      .collection("answers")
      .updateOne(
        { _id: comment.answer_id },
        { $push: { comments: comment._id } }
      )
  );

  queries.push(
    db
      .collection("users")
      .updateOne({ _id: comment.user_id }, { $push: { comments: comment._id } })
  );

  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }

  client.close();
}

async function deleteComment(comment) {
  assert(ObjectID.isValid(comment.answer_id));

  const client = await connectToDB();
  const db = client.db(dbName);

  try {
    await db.collection("comments").deleteOne({ _id: comment._id });
  } catch (error) {
    throw error;
  }

  let queries = [];

  queries.push(
    db
      .collection("answers")
      .updateOne(
        { _id: comment.answer_id },
        { $pull: { comments: comment._id } }
      )
  );

  queries.push(
    db
      .collection("users")
      .updateOne({ _id: comment.user_id }, { $pull: { comments: comment._id } })
  );

  try {
    await Promise.all(queries);
  } catch (error) {
    throw error;
  }

  client.close();
}

async function connectToDB() {
  try {
    return await MongoClient.connect(
      connectionString,
      { useNewUrlParser: true }
    );
  } catch (error) {
    throw error;
  }
}

async function findInCollection(collectionName, query) {
  const client = await connectToDB();
  const db = client.db(dbName);

  let results;

  try {
    results = await db
      .collection(collectionName)
      .find(query)
      .toArray();
  } catch (error) {
    throw error;
  }

  client.close();
  return results;
}

async function updateInCollection(collectionName, query, update) {
  const client = await connectToDB();
  const db = client.db(dbName);

  let results;

  try {
    results = await db.collection(collectionName).updateMany(query, update);
  } catch (error) {
    throw error;
  }

  client.close();
  return results;
}

async function createInCollection(collectionName, document) {
  const client = await connectToDB();
  const db = client.db(dbName);

  let results;

  try {
    results = await db.collection(collectionName).insertOne(document);
  } catch (error) {
    throw error;
  }

  client.close();
  return results;
}

async function deleteInCollection(collectionName, query) {
  const client = await connectToDB();
  const db = client.db(dbName);

  let results;

  try {
    results = await db.collection(collectionName).deleteMany(query);
  } catch (error) {
    throw error;
  }

  client.close();
  return results;
}

//runs through each crud operation
async function crudTesting() {
  let user = {
    firstname: "Jake",
    lastname: "Heckley",
    email: "email@email.email",
    password: "aus",
    username: "TheHeckler",
    rank: 0,
    questionsAsked: [],
    questionsAnswered: [],
    questionsCommented: []
  };
  console.log("creating a new user...\n");
  await createInCollection("users", user);
  let result = await findInCollection("users", { username: "TheHeckler" });
  console.log(result);
  console.log("\nupdating Jakes username to be testing...\n");
  await updateInCollection(
    "users",
    { username: "TheHeckler" },
    { $set: { username: "testing" } }
  );
  result = await findInCollection("users", { username: "testing" });
  console.log(result);
  console.log("\nChanging the name back...\n");
  await updateInCollection(
    "users",
    { username: "testing" },
    { $set: { username: "TheHeckler" } }
  );
  result = await findInCollection("users", { username: "TheHeckler" });
  console.log(result);
  console.log("\ndeleting jake from the database...\n");
  await deleteInCollection("users", { username: "TheHeckler" });
  console.log("done!\n");
  console.log("trying to find jake in the database...\n");
  result = await findInCollection("users", { username: "TheHeckler" });
  console.log("result:", result);
}

async function createAndDeleteCommentTesting() {
  let comment = {
    answer_id: ObjectID("5c3558847f69c33a34ffaf74"),
    user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
    username: "drifts1ut101",
    text: "testing"
  };

  await createComment(comment);

  let results = await findInCollection("comments", {
    text: "testing"
  });

  comment = results[0];
  console.log(comment);

  await deleteComment(comment);
}

async function createAndDeleteAnswerTesting() {
  let newAnswer = {
    user_id: ObjectID("5c2d82de1c9d4400009c4b0f"),
    question_id: ObjectID("5c2eb7ed1c9d4400004a3ad9"),
    username: "dude89C",
    text: "testing answer",
    voteCount: 0,
    verified: false,
    comments: []
  };

  // let result = await findInCollection("questions", { username: "lisa90" });
  // question = result[0];
  // console.log("\nquestion: ", question);

  console.log("\nCreating new answer...");
  await createAnswer(newAnswer);

  // result = await findInCollection("questions", { username: "lisa90" });
  // question = result[0];
  // console.log("\nquestion: ", question);

  //grab newly created answer
  let result = await findInCollection("answers", { text: "testing answer" });
  newAnswer = result[0];
  console.log("\nnew answer: ", newAnswer);

  let comment = {
    answer_id: newAnswer._id,
    user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
    username: "drifts1ut101",
    text: "testing comment"
  };

  //create 5 comments, each will have different objectID's
  console.log("creating 5 comments on the new answer");
  for (i = 0; i < 5; i++) {
    await createComment(comment);
  }

  // result = await findInCollection("questions", { username: "lisa90" });
  // question = result[0];
  // console.log("\nquestion: ", question);

  result = await findInCollection("answers", { text: "testing answer" });
  newAnswer = result[0];
  console.log("\nnew answer: ", newAnswer);

  await deleteAnswer(newAnswer);

  // result = await findInCollection("questions", { username: "lisa90" });
  // question = result[0];
  // console.log("\nquestion: ", question);
}

async function createAndDeleteQuestionTesting() {
  let question = {
    user_id: ObjectID("5c2d80941c9d4400009c4b0a"),
    username: "lisa90",
    text: "testing testing 123",
    tagNames: ["battery", "racecar"],
    answers: []
  };

  console.log("\nCreating Question...");
  await createQuestion(question);

  let result = await findInCollection("questions", {
    text: "testing testing 123"
  });

  question = result[0];

  let answer = {
    user_id: ObjectID("5c2d82de1c9d4400009c4b0f"),
    question_id: question._id,
    username: "dude89C",
    text: "testing answer",
    voteCount: 0,
    verified: false,
    comments: []
  };

  console.log("creating answer...\n");
  createAnswer(answer);

  result = await findInCollection("answers", {
    text: "testing answer"
  });

  answer = result[0];

  let comment = {
    answer_id: answer._id,
    user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
    username: "drifts1ut101",
    text: "testing comment"
  };

  console.log("creating 5 comments on the new answer");
  for (i = 0; i < 5; i++) {
    await createComment(comment);
  }

  result = await findInCollection("questions", {
    text: "testing testing 123"
  });

  question = result[0];
  console.log("\nQuestion:", question);

  console.log("\ndeleting question...");
  await deleteQuestion(question);
}

async function createAndDeleteUserTesting() {
  user = {
    username: "tester1",
    firstname: "test",
    lastname: "user",
    email: "testuser@test.test",
    password: "encrypted string"
  };

  await createUser(user);

  let result = await findInCollection("users", { firstname: "test" });

  user = result[0];

  let question = {
    user_id: user._id,
    username: "tester1",
    text: "testing testing 123",
    tagNames: ["battery", "racecar"],
    answers: []
  };

  await createQuestion(question);
  await createQuestion(question);

  result = await findInCollection("users", { firstname: "test" });

  user = result[0];

  result = await findInCollection("questions", {
    text: "testing testing 123"
  });

  question = result[0];

  let answer = {
    user_id: user._id,
    question_id: question._id,
    username: "tester1",
    text: "testing",
    voteCount: 0,
    verified: false,
    comments: []
  };

  await createAnswer(answer);
  await createAnswer(answer);

  //create a copy of answer
  let answerDifferentQuestion = JSON.parse(JSON.stringify(answer));
  answerDifferentQuestion.question_id = ObjectID("5c2eb7ed1c9d4400004a3ad9");
  answerDifferentQuestion.user_id = ObjectID(answerDifferentQuestion.user_id);
  console.log("answer #2", answerDifferentQuestion);

  await createAnswer(answerDifferentQuestion);
  await createAnswer(answerDifferentQuestion);

  result = await findInCollection("answers", {
    text: "testing"
  });

  answer = result[0];

  let comment = {
    answer_id: answer._id,
    user_id: user._id,
    username: "tester1",
    text: "testing user delete"
  };

  await createComment(comment);
  await createComment(comment);

  result = await findInCollection("users", { firstname: "test" });

  user = result[0];
  console.log("User", result);

  await deleteUser(user);
}

createAndDeleteUserTesting();
