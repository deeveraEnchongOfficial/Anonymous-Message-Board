"use strict";
const { ObjectId } = require("mongodb");
const Thread = require("../controllers/threads");

module.exports = function (app, client) {
  const thread = new Thread(client);
  app
    .route("/api/threads/:board")
    .post(async (req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;
      const now = new Date();
      const doc = {
        name: board,
        text,
        delete_password,
        created_on: now,
        bumped_on: now,
        reported: false,
        replycount: 0,
        replies: [],
      };

      await thread.add(doc);

      res.redirect(`/b/${board}`);
    })
    .get(async (req, res) => {
      const { board } = req.params;

      const threads = await thread.getTen(board);
      res.json(threads);
    })
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;

      const deleted = await thread.deleteIfExists(thread_id, delete_password);
      if (deleted) res.send("success");
      else res.send("incorrect password");
    })
    .put(async (req, res) => {
      const { report_id } = req.body;

      const reported = await thread.report(report_id);
      if (reported) res.send("reported");
    });
  app
    .route("/api/replies/:board")
    .post(async (req, res) => {
      const { board } = req.params;
      const { thread_id, text, delete_password } = req.body;
      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        text,
        created_on: now,
        delete_password,
        reported: false,
      };

      await thread.addReply(thread_id, now, doc);

      res.redirect(`/b/${board}/${thread_id}`);
    })
    .get(async (req, res) => {
      const { thread_id } = req.query;

      const ret = await thread.getOne(thread_id);
      res.json(ret);
    })
    .delete(async (req, res) => {
      const { reply_id, delete_password } = req.body;

      const deleted = await thread.deleteReply(reply_id, delete_password);
      if (deleted) res.send("success");
      else res.send("incorrect password");
    })
    .put(async (req, res) => {
      const { reply_id } = req.body;

      const reported = await thread.reportReply(reply_id);
      if (reported) res.send("reported");
    });
};
