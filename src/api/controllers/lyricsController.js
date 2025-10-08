// functions/api/controllers/lyricsController.js
const supabase = require("../services/supabaseClient");
const axios = require("axios");
const { analyzeLyrics } = require("../services/aiService");

const getLyrics = async (req, res) => {
  const songTitle = req.query.song;
  if (!songTitle) {
    return res.status(400).json({ error: "song parameter is required" });
  }

  try {
    // 1. Supabase 캐시 확인 (learning_score 있는지 기준)
    const { data: existingData, error: fetchError } = await supabase
      .from("lyrics")
      .select("id, text, translated, learning_score")
      .eq("song_id", songTitle);

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError.message);
    }

    // 2. 캐싱된 분석 결과가 있고 learning_score도 존재할 경우 바로 반환
    if (existingData && existingData.some((row) => row.learning_score)) {
      console.log("Cache hit - returning existing AI results");
      return res.json(existingData);
    }

    console.log("Cache miss - fetching from external API...");

    // 2. 외부 음악 API 호출 (가사 가져오기) :todo
    // 2. lyrics 테이블에서 가사 가져오기
    const { data: lyricsData, error: lyricsError } = await supabase
      .from("lyrics")
      .select("id, text")
      .eq("song_id", songTitle);

    if (lyricsError) {
      console.error("Error fetching lyrics from Supabase:", lyricsError);
      return res.status(500).json({ error: "Failed to fetch lyrics from DB" });
    }

    if (!lyricsData || lyricsData.length === 0) {
      return res.status(404).json({ error: "Lyrics not found in DB" });
    }

    res.json(lyricsData);

    // 3. AI 분석 호출
    const { selectedSentences, learningScore } = await analyzeLyrics(
      lyricsData
    );

    // // 4.DB에 캐싱 (AI 분석 결과와 점수 저장)
    // const { error: insertError } = await supabase
    //   .from("lyrics_analysis")
    //   .upsert({
    //     song_title: songTitle,
    //     results: selectedSentences,
    //     learning_score: learningScore,
    //     updated_at: new Date().toISOString(),
    //   });

    // if (insertError) {
    //   console.error("Supabase insert error:", insertError.message);
    // }

    // // 5️⃣ 결과 반환
    // res.json(selectedSentences);
  } catch (error) {
    console.error("Error in getLyrics:", error);
    if (error.response) {
      console.error("Axios response error:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch or analyze lyrics" });
  }
};

module.exports = {
  getLyrics,
};
