const MongoClient = require("mongodb").MongoClient;
let ObjectId = require("mongodb").ObjectID;

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";

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
//testing();

async function getQuestionById(id) {
  return await findInCollection("questions", { _id: ObjectId(id) });
}

async function getQuestionsByTags(tag) {
  return await findInCollection("questions", { tagNames: tag });
}

async function getUserById(userId) {
  return await findInCollection("users", { _id: ObjectId(userId) });
}

async function getUserByUsername(username) {
  return await findInCollection("users", { username: username });
}

async function testingUpdate() {
  let questionById = await getQuestionById("5c2eb7ed1c9d4400004a3ad9");
  //console.log(questionById);
  let questionByTags = await getQuestionsByTags("battery");
  //console.log(questionByTags);
  let userById = await getUserById("5c2d82591c9d4400009c4b0e");
  console.log(userById);
  let userByUsername = await getUserByUsername("picklesdoffle");
  console.log(userByUsername);

  // let demoQuestion = {
  //   username: "lisa90",
  //   text: "shift knob",
  //   tagNames: [],
  //   date: 6642450017443381249,
  //   answers: []
  // };
  //   console.log("\ncreating a new question...\n");
  //   await createInCollection("questions", demoQuestion);

  //   console.log("\nHere is the result before change\n");

  //   result = await findInCollection("questions", { text: "shift knob" });
  //   console.log(result);

  //   console.log("\nHere is the result after change\n");
  //   await updateInCollection(
  //     "questions",
  //     { text: "shift knob" },
  //     { $set: { text: "How to change shift knob?" } }
  //   );
  //   result = await findInCollection("questions", {
  //     text: "How to change shift knob?"
  //   });
  //   console.log(result);

  //   console.log("\ndeleting testQuestion from the database...\n");
  //   await deleteInCollection("questions", { text: "How to change shift knob?" });
  //   console.log("done!\n");
}
testingUpdate();
