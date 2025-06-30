const admin = require("firebase-admin");
const db = admin.database();

const quizScoreModel = {
  async addQuizScore({ user_id, quiz_id, score, date_taken }) {
    const scoreRef = db.ref("quiz_scores").push();
    const scoreData = {
      score_id: scoreRef.key,
      user_id,
      quiz_id,
      score,
      date_taken: date_taken || new Date().toISOString(),
    };

    await scoreRef.set(scoreData);
    return scoreData;
  },
};

module.exports = quizScoreModel;