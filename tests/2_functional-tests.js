const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const Thread = require("../controllers/threads");
const { ObjectId } = require("mongodb");

chai.use(chaiHttp);

suite("Functional Tests", async () => {
  const client = global.client;
  const thread = new Thread(client);

  test("Creating a new thread", async () => {
    try {
      const res = await chai
        .request(server)
        .post("/api/threads/testing")
        .send({ text: "testing_thread", delete_password: "testing_password" });
      assert.equal(res.status, 200);
      // it won't return a json because it is a redirect
      assert.equal(res.type, "text/html");

      const data = await thread.getTen("testing");
      assert.equal(data[0].text, "testing_thread");
      assert.equal(data[0].replycount, 0);
      assert.isArray(data[0].replies);
      assert.hasAllKeys(data[0], ["_id", "bumped_on", "created_on", "replies", "replycount", "text"]);
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Viewing the 10 most recent threads with 3 replies each", async () => {
    try {
      const res = await chai.request(server).get("/api/threads/testing");
      assert.equal(res.status, 200);
      assert.equal(res.type, "application/json");
      assert.isAtMost(res.body.length, 10);
      for (let i = 0; i < res.body.length; i++) {
        assert.isAtMost(res.body[i].replies.length, 3);
        assert.hasAllKeys(res.body[i], ["_id", "bumped_on", "created_on", "replies", "replycount", "text"]);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Deleting a thread with the incorrect password", async () => {
    try {
      const data = await thread.getTen("testing");
      const thread_id = data[0]._id;
      const delete_password = "wrong_password";
      const res = await chai.request(server).delete("/api/threads/testing").send({
        thread_id,
        delete_password,
      });
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.equal(res.text, "incorrect password");
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Deleting a thread with the correct password", async () => {
    try {
      const data = await thread.getTen("testing");
      const thread_id = data[0]._id;
      const delete_password = "testing_password";
      const res = await chai.request(server).delete("/api/threads/testing").send({
        thread_id,
        delete_password,
      });
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.equal(res.text, "success");
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Reporting a thread", async () => {
    try {
      const now = new Date();
      const testing_doc = {
        name: "testing",
        text: "testing_thread",
        delete_password: "testing_password",
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };
      const testing_id = await thread.add(testing_doc);
      const res = await chai.request(server).put("/api/threads/testing").send({
        report_id: testing_id,
      });
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.equal(res.text, "reported");
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Creating a new reply", async () => {
    try {
      const now = new Date();
      const testing_doc = {
        name: "testing",
        text: "testing_thread",
        delete_password: "testing_password",
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };
      const thread_id = await thread.add(testing_doc);
      const delete_password = "testing_password";
      const text = "testing_reply";
      const res = await chai.request(server).post("/api/replies/testing").send({
        thread_id,
        delete_password,
        text,
      });
      const doc = await thread.getOne(thread_id);
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.deepEqual(doc.replies[0].text, text);
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Viewing a single thread with all replies", async () => {
    try {
      const now = new Date();
      const testing_doc = {
        name: "testing",
        text: "testing_thread",
        delete_password: "testing_password",
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };
      const thread_id = await thread.add(testing_doc);
      const res = await chai.request(server).get(`/api/replies/testing?thread_id=${thread_id}`);
      assert.equal(res.status, 200);
      assert.equal(res.type, "application/json");
      assert.hasAllKeys(res.body, ["_id", "bumped_on", "created_on", "replies", "text"]);
      assert.equal(Date(res.body.created_on), Date(testing_doc.created_on));
      assert.equal(Date(res.body.bumped_on), Date(testing_doc.bumped_on));
      assert.equal(res.body.text, testing_doc.text);
      assert.isArray(res.body.replies);
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Deleting a reply with the incorrect password", async () => {
    try {
      const now = new Date();
      const testing_doc = {
        name: "testing",
        text: "testing_thread",
        delete_password: "testing_password",
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };
      const thread_id = await thread.add(testing_doc);
      const delete_password = "wrong_password";
      const res = await chai.request(server).delete("/api/replies/testing").send({
        thread_id,
        delete_password,
      });
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.equal(res.text, "incorrect password");
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Deleting a reply with the correct password", async () => {
    try {
      const now = new Date();
      const testing_doc = {
        name: "testing",
        text: "testing_thread",
        delete_password: "testing_password",
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };
      const testing_reply = {
        _id: new ObjectId(),
        text: "testing_reply",
        created_on: now,
        delete_password: "testing_password",
        reported: false,
      };
      const thread_id = await thread.add(testing_doc);
      const reply = await thread.addReply(thread_id, now, testing_reply);
      const delete_password = "testing_password";
      const res = await chai.request(server).delete("/api/replies/testing").send({
        reply_id: reply.replies[0]._id,
        delete_password,
      });
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.equal(res.text, "success");
    } catch (error) {
      throw new Error(error.message);
    }
  });
  test("Reporting a reply", async () => {
    try {
      const now = new Date();
      const testing_doc = {
        name: "testing",
        text: "testing_thread",
        delete_password: "testing_password",
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };
      const testing_reply = {
        _id: new ObjectId(),
        text: "testing_reply",
        created_on: now,
        delete_password: "testing_password",
        reported: false,
      };
      const thread_id = await thread.add(testing_doc);
      const reply = await thread.addReply(thread_id, now, testing_reply);
      const res = await chai.request(server).put("/api/replies/testing").send({
        reply_id: reply.replies[0]._id,
      });
      assert.equal(res.status, 200);
      assert.equal(res.type, "text/html");
      assert.equal(res.text, "reported");
    } catch (error) {
      throw new Error(error.message);
    }
  });
});
