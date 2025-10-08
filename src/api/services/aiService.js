// src/api/services/aiService.js

const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 전체 가사에서 학습 가치 점수를 각 문장에 부여
 * @param {string} lyrics - 전체 가사 문자열
 * @returns {Promise<Array<{id: number, text: string, score: number}>>}
 */
const analyzeLyrics = async (lyrics) => {
  try {
    const prompt = `
      다음은 노래가사 id와 문장 text로 이루어진 객체 배열입니다.
      각 문장에 대해 한국어 학습자가 배울 가치가 높은지 판단하여 학습점수(score)를 매기고 JSON 배열로 출력하세요.

      평가 기준 (우선순위 순):
      1. 한국어 비율이 높을수록 점수 높게 (최우선)
      2. 숙어/관용어/밈 감지
      3. 문장의 어미, 조사, 문법 구조의 다양성
      4. 단어의 희귀도나 표현력
      5. 문장 길이의 적절함

      조건:
      - score: 0 < x < 1, 소수점 4째자리까지 반영
      - JSON 형태로만 출력
      - 출력 예시:
      [
        {"id":1, "text":"문장1", "score":0.8231},
        {"id":2, "text":"문장2", "score":0.6423}
      ]

      가사:
      ${JSON.stringify(lyrics, null, 4)}

      `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let resultText = completion.choices[0].message.content.trim();

    // ```json ... ``` 제거
    resultText = resultText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result = [];
    try {
      result = JSON.parse(resultText);
    } catch (err) {
      console.error("JSON 파싱 실패:", err.message);
      return [];
    }

    // score 범위 안전하게 0<x<1로 보정
    result = result.map((item) => ({
      ...item,
      score: Math.min(Math.max(item.score, 0.0001), 0.9999),
    }));

    return result;
  } catch (err) {
    console.error("analyzeLyrics() 실패:", err.message);
    return [];
  }
};

module.exports = {
  analyzeLyrics,
};
