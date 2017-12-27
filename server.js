process.env.DEBUG = "*"
const express = require('express')
const app = express()
var session = require('express-session')
var config = require("./config.json");
const fs = require("fs");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
// Prints:
app.use(express.static("assets"))
app.use(session({
  secret: config.sessionkey,
  cookie: {
    secure: false
  }
}))
app.get("/usernamecookie", (req, res) => {
  res.end(req.session.username)
})
app.get('/requestauth', (req, res) => {
  req.session.redirect = req.query.redirect;
  console.log(req.session);
  if (!req.session.redirect) return res.end("401: Malformed request");
  res.sendFile(__dirname + "/assets/getUsername.html");
})
app.get("/haveusername", (req, res) => {
  console.log(req.query, req.session)
  var usernamefile = JSON.parse(fs.readFileSync("./users.json"));
  if (!usernamefile.hasOwnProperty(req.query.username)) return res.sendFile(__dirname + "/assets/incorrectusername.html")
  req.session.username = req.query.username;
  res.sendFile(__dirname + "/assets/passwordAuth.html")
})
app.get("/havepassword", (req, res) => {
  if (!req.session.redirect || req.session.username == undefined || !req.query.password) return res.end("401: Malformed request");
  var usernamefile = JSON.parse(fs.readFileSync("./users.json"));
  var hash = crypto.createHash('sha256');
  hash.update(req.query.password);
  var fullhash = hash.digest('hex');
  if (usernamefile[req.session.username].password !== fullhash) return res.sendFile(__dirname + "/assets/incorrectpassword.html");
  var privatekey = fs.readFileSync("private.key");
  var user = usernamefile[req.session.username];
  user.username = req.session.username
  user.logintime = Date.now();
  var token = jwt.sign(user, privatekey, {
    algorithm: "RS256",
    issuer: "JW-Centro"
  })
  res.redirect(req.session.redirect.replace("$token", token))
})
app.listen(5678, () => console.log('Example app listening on port 3000!'))
