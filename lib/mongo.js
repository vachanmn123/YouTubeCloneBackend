const mongoose = require("mongoose");

// Connect to MongoDB
async function connect() {
  try {
    // Connect to the MongoDB database using the MONGO_URI environment variable
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    // Log any errors that occur when trying to connect to the database
    console.error(err);
  }
}

module.exports = connect;
