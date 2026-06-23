const dns = require("node:dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);


const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const {
 createRemoteJWKSet,
 jwtVerify
} = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(
 new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ msg: "Unauthorized" });
  }
};

const verifyUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ status: false, message: "Forbidden" });
  }
  next();
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ status: false, message: "Forbidden" });
  }
  next();
};


const database = client.db("recipehub_db");

const recipesCollection =
  database.collection("recipes");

const userCollection =
  database.collection("user");


await client.connect();
await client.db("admin").command({ ping: 1 });

app.listen(PORT);