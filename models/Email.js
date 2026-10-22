const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
      select: true, // never returned by queries unless explicitly requested
    },
  },
  { timestamps: true, strict: false } // strict mode stays on, so unknown fields are dropped
);

module.exports = mongoose.model("User", userSchema);