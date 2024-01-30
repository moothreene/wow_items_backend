const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const database = require('./database');
const fs = require('fs');

app.use(cors());

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

app.listen(PORT,()=>{
    console.log(`running on port ${PORT}`);
})