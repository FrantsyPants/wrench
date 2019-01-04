const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const connectionString =
  "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true"; //to cluster
const dbName = "wrench";
const client = new MongoClient(connectionString, { useNewUrlParser: true });

async function getUsers(fields) {
  client.connect(async function(err) {
    assert.equal(null, err);

    const db = client.db(dbName);

    let results;

    try {
      results = await db
        .collection("users")
        .find(fields)
        .toArray();
    } catch (error) {
      throw error;
    }

    client.close();
    return results;
  });
}

getUsers({ username: "lisa90" });
