if (process.env.NODE_ENV !== "production") {
  const dns = require("node:dns");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const validator = require("validator");
const path = require("node:path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());

// ---------- Database (cached for serverless) ----------
let cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }
  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected");
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.log("Mongo error:", e);
    res.status(500).json({ message: "Database connection failed" });
  }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    email = email.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, password });
    }

    res.json({ message: "Logged in", email: user.email });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
