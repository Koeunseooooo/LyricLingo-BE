// functions/api/routes/lyrics.js
const express = require("express");
const router = express.Router();
const { getLyrics } = require("../controllers/lyricsController");

router.get("/", getLyrics);

module.exports = router;
