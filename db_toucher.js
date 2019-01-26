const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const assert = require("assert");

class db_toucher {
  constructor(dbName) {
    this.dbName = dbName;
    this.connectionString =
      "mongodb+srv://admin:letmein_1997@testdb-lfygc.gcp.mongodb.net/test?retryWrites=true";
  }

  async createUser(user) {
    user._id = new ObjectID();

    //This might be bad idk, think about it later
    user.questions = [];
    user.answers = [];
    user.comments = [];
    user.rank = 0;

    console.log("in create user");

    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    try {
      await db.collection("users").insertOne(user);
    } catch (error) {
      client.close();
      throw error;
    }

    let newlyAddedUser;
    try {
      newlyAddedUser = await db.collection("users").findOne({ _id: user._id });
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
    return newlyAddedUser;
  }

  async deleteUser(user) {
    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    //delete user
    await db.collection("users").deleteOne({ _id: user._id });

    //Start with comments, First get a list of documents from the users list of ids
    let comments = await this._getArrayOfDocumentsFromIds(
      db,
      "comments",
      user.comments
    );
    let commentQueries = [];

    //Make a query to delete every comment
    comments.forEach(comment => {
      commentQueries.push(this.deleteComment(comment));
    });

    //wait for all comments to be deleted
    //console.log("deleting comments");
    try {
      await Promise.all(commentQueries);
    } catch (error) {
      throw error;
    }

    //Now answers, get a list of documents from the users list of ids
    let answers = await this._getArrayOfDocumentsFromIds(
      db,
      "answers",
      user.answers
    );
    let answerQueries = [];

    //make "queries to delete answers"
    answers.forEach(answer => {
      answerQueries.push(this.deleteAnswer(answer));
    });

    //wait to delete answers
    //console.log("deleting answers");
    try {
      await Promise.all(answerQueries);
    } catch (error) {
      throw error;
    }

    //Now questions, start by grabbing all of the documents from the users list of ids
    let questions = await this._getArrayOfDocumentsFromIds(
      db,
      "questions",
      user.questions
    );
    let questionQueries = [];

    questions.forEach(question => {
      questionQueries.push(this.deleteQuestion(question));
    });

    //wait for questions to be deleted
    //console.log("deleting questions");
    try {
      await Promise.all(questionQueries);
    } catch (error) {
      throw error;
    }

    client.close();
    console.log("done deleting ", user.username);
  }

  async getAllUsers() {
    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    let users;

    try {
      users = await db
        .collection("users")
        .find({})
        .toArray();
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
    return users;
  }

  async createQuestion(question) {
    const client = await this._connectToDB();
    const db = client.db(this.dbName);

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
      //what if the tag doesnt exist?
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

    let newlyAddedQuestion;
    try {
      newlyAddedQuestion = await db
        .collection("questions")
        .findOne({ _id: question._id });
    } catch (error) {
      client.close();
      throw error;
    }
    client.close();
    return newlyAddedQuestion;
  }

  async deleteQuestion(question) {
    assert(ObjectID.isValid(question._id));

    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    let answers = await this._getArrayOfDocumentsFromIds(
      db,
      "answers",
      question.answers
    );

    //empty query array
    let queries = [];

    //make "queries" to delete all answers
    answers.forEach(answer => {
      queries.push(this.deleteAnswer(answer));
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

  async createAnswer(answer) {
    //question id must be  an objectId
    assert(ObjectID.isValid(answer.question_id));

    const client = await this._connectToDB();
    const db = client.db(this.dbName);

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

    let newlyAddedAnswer;
    try {
      newlyAddedAnswer = db.collection("answers").findOne({ _id: answer._id });
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
    return newlyAddedAnswer;
  }

  async deleteAnswer(answer) {
    assert(ObjectID.isValid(answer.question_id));
    assert(ObjectID.isValid(answer._id));

    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    let comments = await this._getArrayOfDocumentsFromIds(
      db,
      "comments",
      answer.comments
    );

    let queries = [];

    //make "queries" to delete every comment and all it's references
    comments.forEach(comment => {
      queries.push(this.deleteComment(comment));
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

  async createComment(comment) {
    assert(ObjectID.isValid(comment.answer_id));

    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    comment._id = new ObjectID();

    try {
      await db.collection("comments").insertOne(comment);
    } catch (error) {
      client.close();
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
        .updateOne(
          { _id: comment.user_id },
          { $push: { comments: comment._id } }
        )
    );

    try {
      await Promise.all(queries);
    } catch (error) {
      client.close();
      throw error;
    }

    let newlyAddedComment;

    try {
      newlyAddedComment = await db
        .collection("comments")
        .findOne({ _id: comment._id });
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
    return newlyAddedComment;
  }

  async deleteComment(comment) {
    assert(ObjectID.isValid(comment.answer_id));

    const client = await this._connectToDB();
    const db = client.db(this.dbName);

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
        .updateOne(
          { _id: comment.user_id },
          { $pull: { comments: comment._id } }
        )
    );

    try {
      await Promise.all(queries);
    } catch (error) {
      throw error;
    }

    client.close();
  }

  async createTag(tag) {
    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    tag._id = new ObjectID();

    try {
      await db.collection("tags").insertOne(tag);
    } catch (error) {
      client.close();
      throw error;
    }

    let newlyAddedTag;

    try {
      newlyAddedTag = await db.collection("tags").findOne({ _id: tag._id });
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
    return newlyAddedTag;
  }

  async deleteTag(tag) {
    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    //delete the tag itself
    try {
      await db.collection("tags").deleteOne({ _id: tag._id });
    } catch (error) {
      client.close();
      throw error;
    }

    let queries = [];

    //make queries to delete tag from every question its referenced by
    tag.questions.forEach(questionId => {
      queries.push(
        db
          .collection("questions")
          .updateOne({ _id: questionId }, { $pull: { tags: tag.name } })
      );
    });

    try {
      await Promise.all(queries);
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
  }

  async getAllTags() {
    const client = await this._connectToDB();
    const db = client.db(this.dbName);

    let tags;

    try {
      tags = await db
        .collection("tags")
        .find({})
        .toArray();
    } catch (error) {
      client.close();
      throw error;
    }

    client.close();
    return tags;
  }

  async _getArrayOfDocumentsFromIds(db, collectionName, ids) {
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

  async _connectToDB() {
    try {
      return await MongoClient.connect(
        this.connectionString,
        { useNewUrlParser: true }
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = db_toucher;
