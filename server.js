const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const database = require('./database');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const salt = bcrypt.genSaltSync(10);
const secret = "ashkhkshatosjkv";

app.use(cors({credentials:true,origin:"http://localhost:3000"}));
app.use(express.json());
mongoose.connect("mongodb+srv://WowItemDataApi:kogqJtQAjaI0UkDb@wowitemdata.ttre1pw.mongodb.net/WowItemData");

app.get("/api", async (req, res)=>{
  try {
      const items = await database.getWowData(req.query);
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
});

app.get("/img", async (req, res)=>{
  try {
    if(fs.existsSync(`images/${req.query.src}`)){
      res.sendFile(`images/${req.query.src}`,{ root : __dirname});
    }
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
});

app.post("/register", async (req,res)=>{
  const {username, password} = req.body;
  try{
    const userDoc = await User.create(
      {
        username,
        password:bcrypt.hashSync(password,salt)
      }
      );
    res.json(userDoc);
  }catch(error){
    res.status(400).json(error);
  }
});

app.post("/login", async (req,res)=>{

  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passCorrect = bcrypt.compareSync(password,userDoc.password);
  console.log(passCorrect);
  if(passCorrect){
    jwt.sign({username, id:userDoc._id},secret,{},(err,token)=>{
      if(err) throw(err);
      res.cookie("token",token).json("ok");
      }
    );
    res.json
  }else{
    res.status(400).json("Wrong Username or Password");
  }
})

app.listen(PORT,()=>{
    console.log(`running on port ${PORT}`);
})