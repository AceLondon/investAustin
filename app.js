// file: index.js
var _ = require("lodash");
var express = require("express");
var bodyParser = require("body-parser");
var jwt = require('jsonwebtoken');

var passport = require("passport");
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;


/************* users *************/
var users = [
  {
    id: 1,
    name: 'cityofaustin',
    password: '%2yx4'
  },
  {
    id: 2,
    name: 'test',
    password: 'test'
  }
];

/************* jwt + passport *************/
var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'tasmanianDevil';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
  var user = users[_.findIndex(users, {id: jwt_payload.id})];
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);

/************* express routes *************/
var app = express();
app.use(passport.initialize());

// parse application/x-www-form-urlencoded
// for easier testing with Postman or plain HTML forms
app.use(bodyParser.urlencoded({
  extended: true
}));

// parse application/json
app.use(bodyParser.json())

app.get("/", function(req, res) {
  res.status(200).json({message: "Express is up!"});
});

app.post("/login", function(req, res) {
  if(req.body.name && req.body.password){
    var name = req.body.name;
    var password = req.body.password;
  }
  // usually this would be a database call:
  var user = users[_.findIndex(users, {name: name})];
  if( ! user ){
    res.status(401).json({message:"no such user found"});
  }

  if(user.password === req.body.password) {
    // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
    var payload = {id: user.id};
    var token = jwt.sign(payload, jwtOptions.secretOrKey);
    res.json({message: "ok", token: token});
  } else {
    res.status(401).json({message:"passwords did not match"});
  }
});

app.get("/adfs", passport.authenticate('jwt', { session: false }), function(req, res){
  res.json({"adfs":[
      {
        "name":"cap metro downtown",
        "uuid":"9e44efb2-bef9-46de-b4ed-286a9d8072bb"
      },{
        "name":"CapMetro Downtown",
        "uuid":"1ffa7e83-ab76-4d1e-80b5-0fdf11f4b943"
      }, {
        "name":"ThinkEast",
        "uuid":"ca6387a6-33f6-49cb-a642-101b889e742c"
    	}
    ]
  });
});

app.get("/adf/:uuid", passport.authenticate('jwt', { session: false }), function(req, res){
  // res.json("Cool, redirect to: " + "https://app.box.com/shared/static/" + req.params.uuid);
  res.redirect("https://storage.googleapis.com/austin-ar.appspot.com/adfs/" + req.params.uuid);
  // res.redirect("https://storage.googleapis.com/austin-ar.appspot.com/adfs/");
});

app.listen(8081, function() {
  console.log("Express running");
});
