const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://WowItemDataApi:kogqJtQAjaI0UkDb@wowitemdata.ttre1pw.mongodb.net/";
const classes_data = require("./classes")

const client = new MongoClient(uri);
client.connect();

async function getWowData(query){
    let filter = {}
    if(query.class_name!=undefined){
        let wearable = [];
        let class_data = classes_data[query.class_name]
        for(let key of Object.keys(class_data)){
            if(!isNaN(key)){
                if(key < query.level){
                    wearable = wearable.concat(class_data[key])
                }
            }
            else{
                if(class_data[key] == true){
                    filter["inventory_type"] = {"$ne":"two_hand"}
                }
            }
        }
        filter["subclass"] = {"$in":wearable}
    }
    if(query.level!==undefined){
        filter["required_level"] = {"$lt":(+query.level+1)};
    }
    if(query.id!==undefined){
        filter["id"] = +query.id;
    }
    try {
        if (filter!={}){
            console.log(filter);
            const dataset = await client.db('WowItemData').collection('wowData').find(filter).toArray();
            return (dataset[0]);
        }
        
        
    }
    catch {
        console.log("db closed");
        await client.close();
    }
}
module.exports = {getWowData};

