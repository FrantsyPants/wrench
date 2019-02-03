const MongoClient = require("mongodb").MongoClient;
let db_toucher = require("./db_toucher");

//https://jestjs.io/docs/en/setup-teardown
//https://jestjs.io/docs/en/tutorial-async

async function setupDB() {
  const toucher = new db_toucher("wrench_test");
  let user1 = {
    username: "tester1",
    firstname: "test",
    email: "testuser@test.test",
    password: "encrypted string"
  };
  let user2 = {
    username: "tester2",
    firstname: "test",
    lastname: "user",
    email: "testuser@test.test",
    password: "encrypted string"
  };
  let user3 = {
    username: "tester3",
    firstname: "test",
    lastname: "user",
    email: "testuser@test.test",
    password: "encrypted string"
  };

  console.log("Creating users");
  let newUsersArray = await Promise.all([
    toucher.createUser(user1),
    toucher.createUser(user2),
    toucher.createUser(user3)
  ]);

  user1 = newUsersArray[0];
  user2 = newUsersArray[1];
  user3 = newUsersArray[2];

  console.log("creating tags");
  await Promise.all([
    toucher.createTag({ name: "battery", questions: [] }),
    toucher.createTag({ name: "racecar", questions: [] })
  ]);

  let question = {
    user_id: user1._id,
    username: user1.username,
    text: "test question",
    tagNames: ["battery", "racecar"],
    answers: []
  };

  console.log("Creating Question");
  question = await toucher.createQuestion(question);

  let answer = {
    user_id: user2._id,
    question_id: question._id,
    username: user2.username,
    text: "testing answer",
    voteCount: 0,
    verified: false,
    comments: []
  };

  console.log("Creating Answer");
  answer = await toucher.createAnswer(answer);

  let comment = {
    answer_id: answer._id,
    user_id: user3._id,
    username: user3.username,
    text: "testing comment"
  };

  console.log("Creating Comment");
  comment = await toucher.createComment(comment);
}

async function resetDB() {
  const toucher = new db_toucher("wrench_test");
  let users = await toucher.getAllUsers();
  let tags = await toucher.getAllTags();

  let queries = [];
  users.forEach(user => {
    queries.push(toucher.deleteUser(user));
  });
  tags.forEach(tag => {
    queries.push(toucher.deleteTag(tag));
  });

  await Promise.all(queries);
}

beforeEach(async () => {
  await resetDB();
  await setupDB();
}, 20000);

beforeAll(async () => {
  await resetDB();
}, 20000);

it("Has correct number of users, questions, answers and comments after init", async () => {
  expect.assertions(4);
  const toucher = new db_toucher("wrench_test");
  let users = await toucher.getAllUsers();
  let questions = await toucher.getAllQuestions();
  let answers = await toucher.getAllAnswers();
  let comments = await toucher.getAllComments();
  expect(users.length).toBe(3);
  expect(questions.length).toBe(1);
  expect(answers.length).toBe(1);
  expect(comments.length).toBe(1);
}, 20000);

// async function createAndDeleteCommentTesting() {
//   let comment = {
//     answer_id: ObjectID("5c3558847f69c33a34ffaf74"),
//     user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
//     username: "drifts1ut101",
//     text: "testing"
//   };

//   await createComment(comment);

//   let results = await findInCollection("comments", {
//     text: "testing"
//   });

//   comment = results[0];
//   console.log(comment);

//   await deleteComment(comment);
// }

// async function createAndDeleteAnswerTesting() {
//   let newAnswer = {
//     user_id: ObjectID("5c2d82de1c9d4400009c4b0f"),
//     question_id: ObjectID("5c2eb7ed1c9d4400004a3ad9"),
//     username: "dude89C",
//     text: "testing answer",
//     voteCount: 0,
//     verified: false,
//     comments: []
//   };

//   // let result = await findInCollection("questions", { username: "lisa90" });
//   // question = result[0];
//   // console.log("\nquestion: ", question);

//   console.log("\nCreating new answer...");
//   await createAnswer(newAnswer);

//   // result = await findInCollection("questions", { username: "lisa90" });
//   // question = result[0];
//   // console.log("\nquestion: ", question);

//   //grab newly created answer
//   let result = await findInCollection("answers", { text: "testing answer" });
//   newAnswer = result[0];
//   console.log("\nnew answer: ", newAnswer);

//   let comment = {
//     answer_id: newAnswer._id,
//     user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
//     username: "drifts1ut101",
//     text: "testing comment"
//   };

//   //create 5 comments, each will have different objectID's
//   console.log("creating 5 comments on the new answer");
//   for (i = 0; i < 5; i++) {
//     await createComment(comment);
//   }

//   // result = await findInCollection("questions", { username: "lisa90" });
//   // question = result[0];
//   // console.log("\nquestion: ", question);

//   result = await findInCollection("answers", { text: "testing answer" });
//   newAnswer = result[0];
//   console.log("\nnew answer: ", newAnswer);

//   await deleteAnswer(newAnswer);

//   // result = await findInCollection("questions", { username: "lisa90" });
//   // question = result[0];
//   // console.log("\nquestion: ", question);
// }

// async function createAndDeleteQuestionTesting() {
//   let question = {
//     user_id: ObjectID("5c2d80941c9d4400009c4b0a"),
//     username: "lisa90",
//     text: "testing testing 123",
//     tagNames: ["battery", "racecar"],
//     answers: []
//   };

//   console.log("\nCreating Question...");
//   await createQuestion(question);

//   let result = await findInCollection("questions", {
//     text: "testing testing 123"
//   });

//   question = result[0];

//   let answer = {
//     user_id: ObjectID("5c2d82de1c9d4400009c4b0f"),
//     question_id: question._id,
//     username: "dude89C",
//     text: "testing answer",
//     voteCount: 0,
//     verified: false,
//     comments: []
//   };

//   console.log("creating answer...\n");
//   createAnswer(answer);

//   result = await findInCollection("answers", {
//     text: "testing answer"
//   });

//   answer = result[0];

//   let comment = {
//     answer_id: answer._id,
//     user_id: ObjectID("5c2d82591c9d4400009c4b0e"),
//     username: "drifts1ut101",
//     text: "testing comment"
//   };

//   console.log("creating 5 comments on the new answer");
//   for (i = 0; i < 5; i++) {
//     await createComment(comment);
//   }

//   result = await findInCollection("questions", {
//     text: "testing testing 123"
//   });

//   question = result[0];
//   console.log("\nQuestion:", question);

//   console.log("\ndeleting question...");
//   await deleteQuestion(question);
// }

// async function createAndDeleteUserTesting() {
//   user = {
//     username: "tester1",
//     firstname: "test",
//     lastname: "user",
//     email: "testuser@test.test",
//     password: "encrypted string"
//   };

//   await createUser(user);

//   let result = await findInCollection("users", { firstname: "test" });

//   user = result[0];

//   let question = {
//     user_id: user._id,
//     username: "tester1",
//     text: "testing testing 123",
//     tagNames: ["battery", "racecar"],
//     answers: []
//   };

//   await createQuestion(question);
//   await createQuestion(question);

//   result = await findInCollection("users", { firstname: "test" });

//   user = result[0];

//   result = await findInCollection("questions", {
//     text: "testing testing 123"
//   });

//   question = result[0];

//   let answer = {
//     user_id: user._id,
//     question_id: question._id,
//     username: "tester1",
//     text: "testing",
//     voteCount: 0,
//     verified: false,
//     comments: []
//   };

//   await createAnswer(answer);
//   await createAnswer(answer);

//   //create a copy of answer
//   let answerDifferentQuestion = JSON.parse(JSON.stringify(answer));
//   answerDifferentQuestion.question_id = ObjectID("5c2eb7ed1c9d4400004a3ad9");
//   answerDifferentQuestion.user_id = ObjectID(answerDifferentQuestion.user_id);
//   console.log("answer #2", answerDifferentQuestion);

//   await createAnswer(answerDifferentQuestion);
//   await createAnswer(answerDifferentQuestion);

//   result = await findInCollection("answers", {
//     text: "testing"
//   });

//   answer = result[0];

//   let comment = {
//     answer_id: answer._id,
//     user_id: user._id,
//     username: "tester1",
//     text: "testing user delete"
//   };

//   await createComment(comment);
//   await createComment(comment);

//   result = await findInCollection("users", { firstname: "test" });

//   user = result[0];
//   console.log("User", result);

//   await deleteUser(user);
// }

// async function findInCollection(collectionName, query) {
//   const client = await connectToDB();
//   const db = client.db(dbName);

//   let results;

//   try {
//     results = await db
//       .collection(collectionName)
//       .find(query)
//       .toArray();
//   } catch (error) {
//     throw error;
//   }

//   client.close();
//   return results;
// }

// async function updateInCollection(collectionName, query, update) {
//   const client = await connectToDB();
//   const db = client.db(dbName);

//   let results;

//   try {
//     results = await db.collection(collectionName).updateMany(query, update);
//   } catch (error) {
//     throw error;
//   }

//   client.close();
//   return results;
// }

// async function createInCollection(collectionName, document) {
//   const client = await connectToDB();
//   const db = client.db(dbName);

//   let results;

//   try {
//     results = await db.collection(collectionName).insertOne(document);
//   } catch (error) {
//     throw error;
//   }

//   client.close();
//   return results;
// }

// async function deleteInCollection(collectionName, query) {
//   const client = await connectToDB();
//   const db = client.db(dbName);

//   let results;

//   try {
//     results = await db.collection(collectionName).deleteMany(query);
//   } catch (error) {
//     throw error;
//   }

//   client.close();
//   return results;
// }
