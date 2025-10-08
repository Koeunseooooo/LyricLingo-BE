// functions/api/controllers/songsController.js
const supabase = require("../services/supabaseClient");

const getSongs = async (req, res) => {
  const { data, error } = await supabase.from("songs").select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = {
  getSongs,
};
