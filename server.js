const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const validator = require("validator");

const path = require("node:path");

const app = express();

// Serve the WorkHub frontend from the public folder
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(cors());

// ---------- Database ----------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // stores the bcrypt hash only
});
const User = mongoose.model("User", userSchema);

// ---------- LOGIN (creates the user on first login) ----------
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

app.listen(5000, () => console.log("Server running on port 5000"));