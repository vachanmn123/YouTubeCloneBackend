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
  switch (err.name) {
    case "ValidationError":
      res.status(400).json({ message: err.message });
      break;
    case "CastError":
      res.status(404).json({ message: "Resource not found" });
      break;
    case "MongoServerError":
      if (err.code === 11000) {
        res.status(400).json({ message: "Resource already exists" });
        return;
      } else {
        res.status(500).json({ message: "Something went wrong!" });
      }
      break;
    default:
      console.log(err.name);
      console.log(err);
      res.status(500).json({ message: "Something went wrong!" });
      break;
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}\nhttp://localhost:${port}`);
});
