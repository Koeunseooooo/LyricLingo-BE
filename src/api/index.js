// functions/api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes"); // Import the combined router

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Supabase client is now initialized in services/supabaseClient.js
// and imported where needed (in the controllers).

app.get("/", (req, res) => {
  res.send("LyricLingo Server Running");
});

// Use the routes
app.use("/api", routes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // Export the app for serverless environments