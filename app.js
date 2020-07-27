//jshint esversion:6
require('dotenv').config();
const express = require("express");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const _ = require("lodash");


const session = require("express-session");

const passport = require('passport'),  LocalStrategy = require('passport-local').Strategy;

const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveuninitalized:false
}));


app.use(passport.initialize());

app.use(passport.session());


//to test locally
mongoose.connect("mongodb://localhost:27017/userDB",{useUnifiedTopology: true, useCreateIndex: true, 
  useNewUrlParser: true});


const itemsSchema = ({
  name: {
    type: String,
    required: true
  }
});


const Item = mongoose.model("Item",itemsSchema);


const item1 = new Item({
  name: "Welcome to your to-dolist!"
});

const item2 = new Item({
  name: "Go to work!"
});

const item3 = new Item({
  name: "Hit submit to submit!"
});

const defaultItems = [item1, item2, item3];


// const List = mongoose.model("List",listSchema);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  todolist: [{
    work: String
  }
  ]
  
});

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new LocalStrategy(User.authenticate()));

passport.use(new GoogleStrategy({ 
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/todolist",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  
  },
  function(accessToken, refreshToken, profile, cb) {
   // console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
    
      return cb(err, user);
    });
  }
));

function checkAuthentication(req,res,next){
    if(req.isAuthenticated()){
        //req.isAuthenticated() will return true if user is logged in
        next();
    } else{
        res.redirect("/");
    }
}
app.get("/", function(req, res){
  
  res.render("home");
  
});

app.get("/list",checkAuthentication ,function(req, res){
   
 
  res.render("list" ,{listTitle: "Today", newListItems: req.user.todolist});


});


app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));


app.get("/auth/google/todolist", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log(req.user);
    res.redirect("/list");
  });


app.get("/register", function(req, res){
  res.render("register");
});



app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){
  
  User.register({username: req.body.username},req.body.password, function(err, user){
    if(err) {
      console.log(err); 
      res.redirect("/register");
    } else {
      
      passport.authenticate("local")(req, res, function() {
        res.redirect("/list");
      });
    }
  });

  
});

app.post("/", function(req,res){
  
  
  const user = new User({
    email: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err) {
      console.log(err);
    } else { 
      passport.authenticate("local")(req, res, function(){
        
        res.redirect("/list");
      });
    }
  });

});

  
app.post("/list",checkAuthentication,function(req,res){
  const itemName = req.body.newItem;
  const userID=req.user._id;
  console.log(userID);
  
   User.findByIdAndUpdate( userID, {
     $push:{"todolist":{work:itemName} }},
    {safe: true, upsert: true, new : true},
        function(err, model) {
            console.log(err);
        }
   );
  res.redirect("/list");
});

// -----------implementing todo list -----------



app.post("/delete", checkAuthentication,function(req, res) {

 
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(checkedItemId);
  User.update(
    {"_id": req.user._id},
    {$pull:{"todolist":{_id:checkedItemId}}},
    function(err,data){
      if(err) {
        console.log(err);
      } else {
        res.redirect("/list");
      }
    }
  );
  
  
});



app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
//app.listen(port);

app.listen(port, function() {
  console.log("Server started sucessfuly on port ");
});
