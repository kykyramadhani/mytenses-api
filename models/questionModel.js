const admin = require("firebase-admin");
const db = admin.database();

const questionModel = {
  async getAllQuestions() {
    const questionsSnapshot = await db.ref("questions").once("value");
    const questions = questionsSnapshot.val() || {};
    return Object.values(questions);
  },

  async addQuestion({ quiz_id, text, options, correct_option, points }) {
    const questionRef = db.ref("questions").push();
    const questionData = {
      question_id: questionRef.key,
      quiz_id,
      text,
      options,
      correct_option,
      points,
    };

    await questionRef.set(questionData);
    return questionData;
  },
};

module.exports = questionModel;