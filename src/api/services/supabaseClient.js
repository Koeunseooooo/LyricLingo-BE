// functions/api/services/supabaseClient.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: Supabase URL or Key is not defined. Please check your .env file."
  );
  process.exit(1);
}

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized successfully.");
} catch (error) {
  console.error("Error initializing Supabase client:", error.message);
  process.exit(1);
}

module.exports = supabase;
