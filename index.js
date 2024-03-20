const express = require("express");
const cors = require("cors");
const connectMongo = require("./lib/mongo");
const env = require("dotenv");

// Load environment variables from a .env file into process.env
env.config();

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB on startup
// This initializes mongoose and connects to the MongoDB database
connectMongo();

app.use(cors());

// Middleware to parse the request body as JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the routes/index.js file to handle all routes
const routes = require("./routes");
app.use("/", routes);

// Error handler
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "malformatted id" });
  }
  console.error(err);
  return res.status(500).json({ error: "An error occured" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}\nhttp://localhost:${port}`);
});
