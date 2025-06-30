const admin = require("firebase-admin");
const db = admin.database();

const lessonModel = {
  async getAllLessons() {
    const lessonsSnapshot = await db.ref("lessons").once("value");
    const materialsSnapshot = await db.ref("materials").once("value");
    const quizzesSnapshot = await db.ref("quizzes").once("value");
    const questionsSnapshot = await db.ref("questions").once("value");

    const lessons = lessonsSnapshot.val() || {};
    const materials = materialsSnapshot.val() || {};
    const quizzes = quizzesSnapshot.val() || {};
    const questions = questionsSnapshot.val() || {};

    Object.keys(lessons).forEach((lessonId) => {
      lessons[lessonId].materials = {};
      lessons[lessonId].quizzes = {};

      Object.keys(materials).forEach((materialId) => {
        if (materials[materialId].lesson_id === lessonId) {
          lessons[lessonId].materials[materialId] = materials[materialId];
        }
      });

      Object.keys(quizzes).forEach((quizId) => {
        if (quizzes[quizId].lesson_id === lessonId) {
          quizzes[quizId].questions = {};
          Object.keys(questions).forEach((questionId) => {
            if (questions[questionId].quiz_id === quizId) {
              quizzes[quizId].questions[questionId] = questions[questionId];
            }
          });
          lessons[lessonId].quizzes[quizId] = quizzes[quizId];
        }
      });
    });

    return lessons;
  },

  async addLesson({ lesson_id, title, description }) {
    const lessonRef = db.ref(`lessons/${lesson_id}`);
    const snapshot = await lessonRef.once("value");
    if (snapshot.exists()) {
      throw new Error("Lesson already exists");
    }

    const lessonData = { lesson_id, title, description };
    await lessonRef.set(lessonData);
    return lessonData;
  },
};

module.exports = lessonModel;