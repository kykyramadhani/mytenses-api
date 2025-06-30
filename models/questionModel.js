const admin = require("firebase-admin");

const questionModel = {
  async getAllQuestions() {
    const db = admin.database();
    const questionsSnapshot = await db.ref("questions").once("value");
    const questions = questionsSnapshot.val() || {};
    return Object.values(questions);
  },

  async addQuestion({ quiz_id, text, options, correct_option, points }) {
    const db = admin.database();
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