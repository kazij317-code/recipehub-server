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

app.patch("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const result = await userCollection.updateOne(
    query,
    { $inc: { limit: 1 } },
  );
  res.status(200).json({
    success: true,
    message: "Limit increased successfully",
    data: result,
  });
});

app.get("/api/allrecipes", async (req, res) => {
  const recipes = await recipesCollection.find({}).toArray();
  res.status(200).json({ data: recipes });
});

app.get("/api/recipes/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ status: false, message: "Invalid recipe id" });
  }
  const recipe = await recipesCollection.findOne({ _id: new ObjectId(id) });
  if (!recipe) {
    return res.status(404).json({ status: false, message: "Recipe not found" });
  }
  res.status(200).json({ data: recipe });
});

  app.get("/api/user-recipes", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).json({ status: false, message: "Email is required" });
      }
      const recipes = await recipesCollection.find({ userEmail: email }).toArray();
      res.status(200).json({ data: recipes });
    });

app.post("/api/recipes", verifyToken, verifyUser, async (req, res) => {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(400).json({ status: false, message: "User email not found in token" });
      }

      const dbUser = await userCollection.findOne({ email: userEmail });
      const isPremium = dbUser?.plan === "premium" || dbUser?.isPremium === true;

      if (!isPremium) {
        const recipeCount = await recipesCollection.countDocuments({ userEmail });
        if (recipeCount >= 2) {
          return res.status(403).json({
            status: false,
            message: "Recipe limit reached. Basic accounts are limited to 2 recipes. Please upgrade to Premium."
          });
        }
      }

      const body = req.body;
      const data = { ...body, createdAt: new Date() };
      const result = await recipesCollection.insertOne(data);
      res.status(201).json({
        status: true,
        message: "recipe created successfully",
        data: result,
      });
    });

const dbUser = await userCollection.findOne({ email: userEmail });
      const isPremium = dbUser?.plan === "premium" || dbUser?.isPremium === true;


if (!isPremium) {
        const recipeCount = await recipesCollection.countDocuments({ userEmail });
        if (recipeCount >= 2) {
          return res.status(403).json({
            status: false,
            message: "Recipe limit reached. Basic accounts are limited to 2 recipes. Please upgrade to Premium."
          });
        }
      }
await client.connect();
await client.db("admin").command({ ping: 1 });

app.listen(PORT);