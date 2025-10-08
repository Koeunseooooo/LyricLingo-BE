// functions/api/controllers/lyricsController.js
const supabase = require("../services/supabaseClient");
const axios = require("axios");
const { analyzeLyrics } = require("../services/aiService");

const getLyrics = async (req, res) => {
  const songTitle = req.query.song;
  if (!songTitle) {
    return res.status(400).json({ error: "song parameter is required" });
  }

  // 1. Supabase 캐시 확인
  try {
    const { data: existingData } = await supabase
      .from("lyrics")
      .select("*")
      .eq("song_title", songTitle)
      .maybeSingle();

    if (existingData) {
      return res.json(existingData.results); // Return the cached results
    }
  } catch (dbError) {
    console.error("Error checking cache in Supabase:", dbError);
    // Continue to fetch from API, but log the error
  }

  try {
    // 2. 외부 음악 API 호출 (가사 가져오기) -> todo
    // 2. 가사 데이터 미리 저장 -> 분석 부분만 실제 진행
    const { data } = await axios.get(
      "https://api.musixmatch.com/ws/1.1/matcher.lyrics.get",
      {
        params: {
          q_track: songTitle,
          apikey: process.env.MUSIXMATCH_API_KEY,
        },
      }
    );

    const lyricsBody = data.message.body.lyrics.lyrics_body;
    if (!lyricsBody) {
      return res.status(404).json({ error: "Lyrics not found" });
    }
    // Musixmatch adds a disclaimer at the end, let's remove it.
    const fullLyrics = lyricsBody.split("...")[0];

    // 3️⃣ AI 분석 호출
    const selectedSentences = await analyzeLyrics(fullLyrics);

    // 4️⃣ DB에 캐싱
    await supabase.from("lyrics_analysis").insert({
      song_title: songTitle,
      results: selectedSentences,
    });

    // 5️⃣ 결과 반환
    res.json(selectedSentences);
  } catch (error) {
    console.error("Error fetching lyrics or analyzing:", error);
    if (error.response) {
      console.error("Axios response error:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch lyrics or analyze" });
  }
};

module.exports = {
  getLyrics,
};
