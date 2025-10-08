// functions/api/routes/index.js
const express = require("express");
const router = express.Router();

const songsRouter = require("./songs");
const lyricsRouter = require("./lyrics");

router.use("/songs", songsRouter);
router.use("/lyrics", lyricsRouter);

module.exports = router;
