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
