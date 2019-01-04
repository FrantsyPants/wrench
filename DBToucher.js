const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";
const client = new MongoClient(connectionString, { useNewUrlParser: true });

async function getUsers(fields) {
  client.connect(async function(err) {
    assert.equal(null, err);

    console.log("Connected successfully to server");
    const db = client.db(dbName);

    var results = await findInCollection(db.collection("users"), fields);

    client.close();
    console.log(results);
    return results;
  });
}

async function getQuestions() {}

const findInCollection = async function(collection, fields) {
  if (!fields) fields = {};

  try {
    return await collection.find(fields).toArray();
  } catch (error) {
    throw error;
  }
};

//getUsers({ username: "lisa90" });
getUsers();
