const admin = require("firebase-admin");

const quizModel = {
  async addQuiz({ lesson_id, quiz_id, title, total_points }) {
    const db = admin.database();
    const quizRef = db.ref(`quizzes/${quiz_id}`);
    const quizData = { quiz_id, lesson_id, title, total_points };
    await quizRef.set(quizData);
    return quizData;
  },
};

module.exports = quizModel;