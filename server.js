"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const db = require("./db");

const app = express();

db.connect()
  .then(client => {
    global.client = client;
    const apiRoutes = require("./routes/api.js");
    const fccTestingRoutes = require("./routes/fcctesting.js");
    const runner = require("./test-runner");

    app.use("/public", express.static(process.cwd() + "/public"));

    app.use(cors({ origin: "*" })); //For FCC testing purposes only

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Sets "X-DNS-Prefetch-Control: off"
    app.use(
      helmet.dnsPrefetchControl({
        allow: false,
      })
    );

    // Sets "X-Frame-Options: SAMEORIGIN"
    app.use(
      helmet.frameguard({
        action: "sameorigin",
      })
    );

    // Removes the X-Powered-By header if it was set.
    app.use(helmet.hidePoweredBy());

    // Sets "Referrer-Policy: origin"
    app.use(
      helmet.referrerPolicy({
        policy: "same-origin",
      })
    );

    //Sample front-end
    app.route("/b/:board/").get(function (req, res) {
      res.sendFile(process.cwd() + "/views/board.html");
    });
    app.route("/b/:board/:threadid").get(function (req, res) {
      res.sendFile(process.cwd() + "/views/thread.html");
    });

    //Index page (static HTML)
    app.route("/").get(function (req, res) {
      res.sendFile(process.cwd() + "/views/index.html");
    });

    //For FCC testing purposes
    fccTestingRoutes(app);

    //Routing for API
    apiRoutes(app, client);

    //404 Not Found Middleware
    app.use(function (req, res, next) {
      res.status(404).type("text").send("Not Found");
    });

    //Start our server and tests!
    app.listen(3000, function () {
      console.log("Listening on port 3000");
      if (process.env['NODE_ENV'] === "test") {
        console.log("Running Tests...");
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            var error = e;
            console.log("Tests are not valid:");
            console.log(error);
          }
        }, 1500);
      }
    });
  })
  .catch(err => {
    console.log(err);
  });
module.exports = app; //for testing
