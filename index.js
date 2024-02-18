const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const connectDB = require("./db");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;
connectDB();
app.use(
  "/public",
  express.static("public", {
    extensions: ["css"],
    setHeaders: (res, path, stat) => {
      res.set("Content-Type", "text/css");
    },
  })
);
app.use(bodyParser.json()); // necessary to configure server to receive variables from xml requests
app.set("view engine", "ejs");
app.use(express.static("static"));
app.use(
  "/scripts",
  express.static("scripts", {
    extensions: ["js"],
    setHeaders: (res, path, stat) => {
      res.set("Content-Type", "application/javascript");
    },
  })
);
/***********************************************************************************************************************/
// Below given code is required for google authentication including the ".env" and "auth.js" file
const passport = require("passport");
const session = require("express-session");
require("./auth");
const { parse } = require("dotenv");
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialised: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    prompt: "select_account", // to prevent autoselecting of the account and give user an option to select
  })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure",
  })
);
app.get("/auth/google/success", isLoggedIn, async (req, res) => {
  res.redirect("/home");
});
app.get("/auth/google/failure", isLoggedIn, (req, res) => {
  alert("Invalid user");
  res.redirect("/");
});
app.get("/auth/google/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
/***********************************************************************************************************************/

const Schema = mongoose.Schema;
const facultySchema = new Schema({
  name: String,
  designation: String,
  email: String,
  contact: Number,
  department: String,
});
const courseSchema = new Schema({
  faculty_id: String,
  course_name: String,
  semester: Number,
  type: String,
  exam_type: String,
  questions: Array,
  number_of_questions: Number,
});
const course = mongoose.model("course", courseSchema);
const faculty = mongoose.model("faculty", facultySchema);

let flag = false;
let courseAddedFlag = false;
let courseAlreadyAddedFlag=false;
app.get("/", (req, res) => {
  flag = false;
  res.render("login", { flag });
});
// Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client . This error suggests that the response headers are being sent twice. This usually happens when you attempt to send both a redirect and a render in the same request.
let course_id;
app.get("/home", async (req, res) => {
  const response = await faculty.findOne({ email: `${req.user.email}` });
  //   console.log(response);
  if (response == null) {
    flag = true;
    res.render("login", { flag });
  } else {
    course_id = response._id;
    res.render("index", { id: course_id, courseAddedFlag, courseAlreadyAddedFlag });
  }
});
app.post("/courses", async (req, res) => {
  // console.log(req.body);
  // The data we are receiving here will be added in the collection "courses"
  const response = await course.find({
    faculty_id: req.body.faculty_id,
    course_name: req.body.course_name,
    semester: parseInt(req.body.semester),
    type: req.body.type,
    exam_type: req.body.exam_type,
  });
  // console.log(response);
  if (response.length == 0) {
    await course.create({
      faculty_id: req.body.faculty_id,
      course_name: req.body.course_name,
      semester: parseInt(req.body.semester),
      type: req.body.type,
      exam_type: req.body.exam_type,
      number_of_questions: parseInt(req.body.number_of_questions),
    });
    let questionArray = [];
    for (let i = 0; i < req.body.number_of_questions; i++) {
      let question;
      if(!Array.isArray(req.body.question)){
        question=req.body.question;
      }
      else{
        question=req.body.question[i]
      }
      questionArray.push({
        id: `${i + 1}`,
        question: question,
        weightage: req.body.weightage[i],
        course_outcome: req.body.courseOutcome[i],
      });
      if (i == req.body.number_of_questions - 1) {
        // console.log("Question Array", questionArray);
        await course.updateOne(
          {
            faculty_id: req.body.faculty_id,
            course_name: req.body.course_name,
            semester: parseInt(req.body.semester),
            type: req.body.type,
            exam_type: req.body.exam_type,
            number_of_questions: parseInt(req.body.number_of_questions),
          },
          { $set: { questions: questionArray } }
        );
      }
    }
    courseAddedFlag=true;
    res.render("index", { id: course_id, courseAddedFlag,courseAlreadyAddedFlag });
    courseAddedFlag = false;
  } else {
    courseAlreadyAddedFlag=true;
    res.render("index", { id: course_id,courseAddedFlag,courseAlreadyAddedFlag });
    courseAlreadyAddedFlag=false;
  }
});

app.listen(port, () => {
  console.log(`server listening on the port ${port}`);
});
