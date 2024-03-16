const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  imageURL: { type: String, default: "" },
  subscribers: {
    type: Array(mongoose.Schema.Types.ObjectId),
    default: [],
    ref: "User",
  },
  subscriberCount: { type: Number, default: 0 },

  isAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
