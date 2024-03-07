const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const database = require('./database');
const fs = require('fs');

const mongoose = require('mongoose');
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const salt = bcrypt.genSaltSync(10);
const secret = "ashkhkshatosjkv";

const multer = require("multer");
const upload = multer({dest:"uploads/"});

app.use(cors({credentials:true,origin:"https://wow-item-frontend-379b28d1a268.herokuapp.com"}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/images", express.static(__dirname+"/images"));
mongoose.connect(process.env.DATABASE_URL);

app.get("/api", async (req, res)=>{
  try {
      const items = await database.getWowData(req.query);
      res.json(items);
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
  if(passCorrect){
    jwt.sign({username, id:userDoc._id},secret,{},(err,token)=>{
      if(err) throw(err);
      res.cookie("token",token,{secure: true, sameSite: 'none'}).json({
        id:userDoc._id,
        username,
      });
      }
    );
  }else{
    res.status(400).json("Wrong Username or Password");
  }
});

app.get("/profile", (req,res)=>{
  const {token} = req.cookies;
  jwt.verify(token,secret,{},(error,data)=>{
    if(error) throw error
    res.json(data);
  });
});

app.post("/logout", (req,res)=>{
  res.cookie("token","").json("ok");
});

app.post("/post",upload.single("file"), async (req,res)=>{
  const {originalname, path} = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = `${path}.${ext}`;
  fs.renameSync(path, newPath);
  res.json(req.file);

  const {token} = req.cookies;
  jwt.verify(token,secret,{},async (error,data)=>{
    if(error) throw error
    const {title, summary, content} = req.body;
    const postDoc = await Post.create({
    title,
    summary,
    content,
    cover:newPath,
    author:data.id,
  })
  });
  
});

app.get("/post", async(req,res)=>{
  const posts = await Post
    .find()
    .populate("author",["username"])
    .sort({createdAt:-1});
  res.json(posts);
})

app.get("/post/:id", async(req,res)=>{
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate("author",["username"]);
  res.json(postDoc);
})

app.put("/post", upload.single("file"), async(req,res)=>{
  let newPath = null;
  if(req.file){
    const {originalname, path} = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = `${path}.${ext}`;
    fs.renameSync(path, newPath);
  }

  const {token} = req.cookies;
  jwt.verify(token,secret,{}, async(error,data)=>{
    if(error) throw error
    const {title, summary, content, id} = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author)  === JSON.stringify(data.id);
    if(!isAuthor){
      res.status(400).json("you are not the author")
      throw "you are not the author"
    }
    const updateRes = await Post.findByIdAndUpdate(id,{
      title, 
      summary, 
      content,
      cover:newPath?newPath:postDoc.cover,
    });
    res.json(updateRes);
  });

})

app.put("/delete/:id", async(req,res)=>{
  const {token} = req.cookies;
  const {id} = req.params;
  const postDoc = await Post.findById(id);
  jwt.verify(token,secret,{}, async(error,data)=>{
    if(error) throw error
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(data.id);
    if(!isAuthor){
      res.status(400).json("you are not the author")
      throw "you are not the author"
    }
    fs.unlink(postDoc.cover, err=>{
      if(err) console.log(err);
      else{
        console.log(postDoc.cover+" deleted successfully");
      }
    })
    const deleteRes = await Post.findByIdAndDelete(id);
    res.json(deleteRes);
  });
})

app.listen(PORT,()=>{
    console.log(`running on port ${PORT}`);
})