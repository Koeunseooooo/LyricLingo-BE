// functions/api/controllers/lyricsController.js
const supabase = require("../services/supabaseClient");
const { analyzeLyrics } = require("../services/aiService");

/**
 * GET /api/lyrics?song=...
 */
const getLyrics = async (req, res) => {
  const songId = req.query.song;
  if (!songId)
    return res.status(400).json({ error: "song parameter is required" });

  try {
    // 1) 기존 DB에서 가사(라인) 조회
    const { data: existingRows, error: selectErr } = await supabase
      .from("lyrics")
      .select("id, line_no, text, translated, learning_score")
      .eq("song_id", songId);

    if (selectErr) {
      console.error("Supabase select error:", selectErr);
      return res.status(500).json({ error: "DB 조회 실패" });
    }

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ error: "Lyrics not found in DB" });
    }

    // 2) 캐시 히트 판단 (learning_score가 null/0이 아닌 값이 하나라도 있으면 히트)
    const hasValidScore = existingRows.some(
      (r) => r.learning_score != null && r.learning_score !== 0
    );

    // helper: DB에서 최상위 unique 결과 가져와 반환하는 함수
    const fetchAndReturnTop = async () => {
      const { data: topRows, error: topErr } = await supabase
        .from("lyrics")
        .select("line_no, text, translated, learning_score")
        .eq("song_id", songId)
        .order("learning_score", { ascending: false })
        .limit(10); // 중복 제거 전 여유 있게 조회

      if (topErr) {
        console.error("DB fetch top error:", topErr);
        return res.status(500).json({ error: "DB 조회 실패" });
      }

      // ES6 Map으로 text 기준 중복 제거하고 상위 5개만 반환
      const uniqueTop = Array.from(
        new Map(topRows.map((item) => [item.text, item])).values()
      ).slice(0, 5);

      return res.json(uniqueTop);
    };

    if (hasValidScore) {
      console.log("Cache hit - returning existing AI results");
      return fetchAndReturnTop();
    }

    // 3) 캐시 미스: AI 분석 실행
    console.log("Cache miss - calling analyzeLyrics...");
    // analyzeLyrics expects [{id, text}, ...]
    const payloadForAI = existingRows.map((r) => ({
      id: r.line_no ?? r.id,
      text: r.text,
    }));

    const analyzedResults = await analyzeLyrics(payloadForAI);

    if (!analyzedResults || analyzedResults.length === 0) {
      console.error("analyzeLyrics returned no results");
      return res.status(500).json({ error: "AI 분석 실패" });
    }

    // 4) DB 업데이트 (update-only). Promise.all 결과 배열을 받아서 에러 체크
    const nowIso = new Date().toISOString();
    const updatePromises = analyzedResults.map((item) =>
      supabase
        .from("lyrics")
        .update({
          learning_score: item.score,
          translated: item.translated,
          updated_at: nowIso,
        })
        .match({ song_id: songId, line_no: item.id })
    );

    const updateResults = await Promise.all(updatePromises);

    // 에러가 있는지 확인
    const updateErrors = updateResults
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.error);

    if (updateErrors.length > 0) {
      updateErrors.forEach(({ r, idx }) =>
        console.error(`Update failed for item index ${idx}:`, r.error.message)
      );
      // 업데이트 실패가 있어도 계속 진행해서 DB에서 최종 결과를 보여줄지 결정
      // 여기서는 실패를 로그로 남기고 사용자에게는 성공적으로 처리된 결과를 보여줌
    }

    // 5) 업데이트 후 DB에서 다시 상위 결과 조회 및 중복 제거해서 반환
    return fetchAndReturnTop();
  } catch (err) {
    console.error("Error in getLyrics:", err);
    return res.status(500).json({ error: "서버 내부 오류" });
  }
};

module.exports = {
  getLyrics,
};
