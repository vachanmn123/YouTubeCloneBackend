const { default: mongoose } = require("mongoose");

const kittySchema = new mongoose.Schema({
  title: String,
});

const Kitten = mongoose.model("Kitten", kittySchema);

module.exports = Kitten;
