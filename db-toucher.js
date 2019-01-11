const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const assert = require("assert");

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";

async function createQuestion(question) {
  question._id = new ObjectID();
  await createInCollection("questions", question);

  let queries = [];
  queries.push(
    updateInCollection(
      "users",
      { _id: question.user_id },
      { $addToSet: { questions: question._id } }
    )
  );
  question.tagNames.forEach(element => {
    queries.push(
      updateInCollection(
        "tags",
        { name: element },
        { $addToSet: { questions: question._id } }
      )
    );
  });
  await Promise.all(queries);
}

async function deleteQuestion(question) {
  assert(ObjectID.isValid(question._id));

  await deleteInCollection("questions", { _id: question._id });

  let queries = [];
  queries.push(
    updateInCollection(
      "users",
      { _id: question.user_id },
      { $pull: { questions: question._id } }
    )
  );
  question.tagNames.forEach(element => {
    queries.push(
      updateInCollection(
        "tags",
        { name: element },
        { $pull: { questions: question._id } }
      )
    );
  });
  await Promise.all(queries);
}

//question id must be  an objectId
async function createAnswer(answer) {
  assert(ObjectID.isValid(answer.question_id));

  answer._id = new ObjectID();
  answer.voteCount = 0;
  answer.verified = false;
  await createInCollection("answers", answer);

  let queries = [];
  queries.push(
    updateInCollection(
      "questions",
      { _id: answer.question_id },
      { $push: { answers: answer._id } }
    )
  );
  queries.push(
    updateInCollection(
      "users",
      { _id: answer.user_id },
      { $push: { answers: answer._id } }
    )
  );
  await Promise.all(queries);
}

async function deleteAnswer(answer) {
  assert(ObjectID.isValid(answer.question_id));
  assert(ObjectID.isValid(answer._id));

  //Delete Comments within the answer before deleting the answer
  let queries = [];

  //Make queries to find each comment to get the full object
  //which is needed so it comments and there references can
  //be deleted with deleteComment(comment)
  answer.comments.forEach(commentID => {
    queries.push(findInCollection("comments", { _id: commentID }));
  });

  //wait for all of the comments (Each comment is still wrapped in an array)
  commentsWrapped = await Promise.all(queries);

  //Since findByCollection returns an array just look at the first
  //and only element. It's the only element because were searching
  //by objectID.
  const comments = commentsWrapped.map(element => {
    return element[0];
  });

  //reset queries array
  queries = [];

  //make "queries" to delete every comment and all it's references
  comments.forEach(comment => {
    queries.push(deleteComment(comment));
  });

  //wait for all the comments to delete
  await Promise.all(queries);

  //Delete the answer
  await deleteInCollection("answers", { _id: answer._id });

  //Delete the answers reference in its question.
  queries.push(
    updateInCollection(
      "questions",
      { _id: answer.question_id },
      { $pull: { answers: answer._id } }
    )
  );

  //Delete the answers reference in the user that made it.
  queries.push(
    updateInCollection(
      "users",
      { _id: answer.user_id },
      { $pull: { answers: answer._id } }
    )
  );

  //Wait for all added queries to complete.
  await Promise.all(queries);
}

async function createComment(comment) {
  assert(ObjectID.isValid(comment.answer_id));

  comment._id = new ObjectID();
  await createInCollection("comments", comment);

  await updateInCollection(
    "answers",
    { _id: comment.answer_id },
    { $push: { comments: comment._id } }
  );

  await updateInCollection(
    "users",
    { _id: comment.user_id },
    { $push: { comments: comment._id } } //push/addToSet ?
  );
}

async function deleteComment(comment) {
  console.log("answer id: ", comment.answer_id);
  assert(ObjectID.isValid(comment.answer_id));
  await deleteInCollection("comments", { _id: comment._id });

  await updateInCollection(
    "answers",
    { _id: comment.answer_id },
    { $pull: { comments: comment._id } }
  );

  await updateInCollection(
    "users",
    { _id: comment.user_id },
    { $pull: { comments: comment._id } } //push/addToSet ?
  );
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
  console.log("\nNew Question:", question);

  console.log("\nFinding tags...");
  let tags = await findInCollection("tags", {});
  console.log("\ntags:", tags);

  console.log("\nfinding user who asked question...");
  let lisa = await findInCollection("users", { username: question.username });
  console.log("\nuser:", lisa);

  console.log("\ndeleting question...");
  await deleteQuestion(question);

  console.log("\nFinding tags...");
  tags = await findInCollection("tags", {});
  console.log("\ntags:", tags);

  console.log("\nfinding user who asked question...");
  lisa = await findInCollection("users", { username: question.username });
  console.log("\nuser:", lisa);
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

  console.log("\nCreating new answer...");
  await createAnswer(newAnswer);

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

  result = await findInCollection("answers", { text: "testing answer" });
  newAnswer = result[0];
  console.log("\nnew answer: ", newAnswer);

  deleteAnswer(newAnswer);
}

async function createAndDeleteCommentTesting() {
  let comment = {
    answer_id: ObjectID("5c3558847f69c33a34ffaf74"),
    user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
    username: "drifts1ut101",
    text: "testing"
  };

  let results = await findInCollection("comments", {
    text: "testing"
  });
  comment = results[0];
  console.log(comment);

  await deleteComment(comment);

  //await createComment(comment);
}

createAndDeleteAnswerTesting();
