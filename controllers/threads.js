const { ObjectId } = require("mongodb");
const client = require("../db");

module.exports = class Thread {
  constructor(client) {
    this.client = client;
    this.thread = this.client.db("Main").collection("Threads");
  }

  async add(doc) {
    const ret = await this.thread.insertOne(doc);
    return ret.insertedId;
  }

  async addReply(id, date, doc) {
    const ret = await this.thread.findOneAndUpdate(
      { _id: ObjectId(id) },
      { $set: { bumped_on: date }, $inc: { replycount: 1 }, $push: { replies: { $each: [doc], $position: 0 } } },
      { returnDocument: "after" }
    );
    return ret.value;
  }

  async getTen(name, limit = 10) {
    const aggr = [
      {
        $match: {
          name: name,
        },
      },
      {
        $sort: {
          bumped_on: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          text: 1,
          created_on: 1,
          bumped_on: 1,
          replycount: 1,
          replies: {
            $slice: ["$replies", 3],
          },
        },
      },
      {
        $project: {
          "replies.delete_password": 0,
          "replies.reported": 0,
        },
      },
    ];
    const ret = await this.thread.aggregate(aggr).toArray();
    return ret;
  }

  async getOne(id) {
    const aggr = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $project: {
          "replies.delete_password": 0,
          "replies.reported": 0,
          "reported": 0,
          "delete_password": 0,
          "name": 0,
          "replycount": 0,
        },
      },
    ];
    const ret = await this.thread.aggregate(aggr).toArray();
    return ret[0];
  }
  async deleteIfExists(id, password) {
    const ret = await this.thread.findOneAndDelete({ _id: new ObjectId(id), delete_password: password });
    return ret.value;
  }

  async deleteReply(id, password) {
    const ret = await this.thread.findOneAndUpdate(
      {
        "replies._id": new ObjectId(id),
        "replies.delete_password": password,
      },
      { $set: { "replies.$.text": "[deleted]" } },
      { returnDocument: "after" }
    );
    return ret.value;
  }

  async report(id) {
    const ret = await this.thread.findOneAndUpdate(
      {
        _id: new ObjectId(id),
      },
      { $set: { reported: true } },
      { returnDocument: "after" }
    );
    return ret.value;
  }

  async reportReply(id) {
    const ret = await this.thread.findOneAndUpdate(
      {
        "replies._id": new ObjectId(id),
      },
      { $set: { "replies.$.reported": true } },
      { returnDocument: "after" }
    );
    return ret.value;
  }
};
