const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";

async function createQuestion(question) {
  question._id = new ObjectID();
  queries = [];
  queries.push(createInCollection("questions", question));
  queries.push(
    updateInCollection(
      "users",
      { _id: question.user_id },
      { $push: { questions: question._id } }
    )
  );
  question.tagNames.forEach(async element => {
    queries.push(
      updateInCollection(
        "tags",
        { name: element },
        { $push: { questions: question._id } }
      )
    );
  });
  await Promise.all(queries);
}

async function deleteQuestion(question) {
  queries = [];
  queries.push(deleteInCollection("questions", { _id: question._id }));
  queries.push(
    updateInCollection(
      "users",
      { _id: question.user_id },
      { $pull: { questions: question._id } }
    )
  );
  question.tagNames.forEach(async element => {
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
async function createAnswer(answer, questionId) {}

async function createComment(comment, questionId, answerId) {}

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

createAndDeleteQuestionTesting();
