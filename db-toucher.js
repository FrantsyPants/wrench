const MongoClient = require("mongodb").MongoClient;

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";

async function createQuestion(question) {
  await createInCollection("questions", question);
}

//question id must be  an objectId
async function createAnswer(answer, questionId) {
  await updateInCollection(
    "questions",
    { _id: questionId },
    { $push: { answers: answer } }
  );
}

async function createComment(comment, questionId, answerId) {
  await updateInCollection("questions");
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
async function testing() {
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

  result = await findInCollection("users", { username: "TheHeckler" });
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

testing();
