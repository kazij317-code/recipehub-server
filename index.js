const dns = require("node:dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);


const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello Recipehub!");
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("recipehub_db");

const recipesCollection =
  database.collection("recipes");

const userCollection =
  database.collection("user");


await client.connect();
await client.db("admin").command({ ping: 1 });

app.listen(PORT);