// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Supabase 연결
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key is not defined. Please check your .env file.');
  process.exit(1); // Exit the process if essential env vars are missing
}

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully.');
} catch (error) {
  console.error('Error initializing Supabase client:', error.message);
  process.exit(1); // Exit the process if Supabase client initialization fails
}

app.get("/", (req, res) => {
  res.send("LyricLingo Server Running");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/songs", async (req, res) => {
  const { data, error } = await supabase.from("songs").select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
