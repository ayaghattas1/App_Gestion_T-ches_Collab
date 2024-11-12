const express = require("express");
const app = express();
require("dotenv").config({ path: './.env' });
const mongoose = require("mongoose");
const userRouter=require("./routers/user")
const projectRouter=require("./routers/project")
const tacheRouter=require("./routers/tache")
const columnRouter=require("./routers/column")
const cors = require('cors');
app.use(cors())
app.use(express.json());
app.use(express.static('uploads'));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Heders",
    "Origin,X-Requsted-With,Content,Accept,Content-Type,Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  next();
});
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.afeysny.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`  )
  .then(() => console.log("Connexion a MongoDB réussie !"))
  .catch((e) => console.log("Connexion a MongoDB échouée!", e));
// const mongoDBUri = 'mongodb://127.0.0.1:27017/TACHETY';
// mongoose.connect(mongoDBUri
// ).then(() => console.log("connexion a MongoDB reussie!"))
// .catch((e) => console.log("connexion a MongoDB échouée!",e))
app.use("/", userRouter)
app.use("/project", projectRouter)
app.use("/tache", tacheRouter)
app.use("/column", columnRouter)
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'middleware', 'uploads')));
console.log(path.join(__dirname, 'uploads'));


app.use((req, res, next) => {
  console.log(req.headers);
  next();
});
module.exports = app;