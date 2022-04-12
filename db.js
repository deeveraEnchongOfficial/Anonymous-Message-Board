require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env['DB'];

module.exports = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
