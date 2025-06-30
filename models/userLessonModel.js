const admin = require("firebase-admin");

const userLessonModel = {
  async getAllLessonProgress(username) {
    const db = admin.database();
    const userSnapshot = await db.ref(`users/${username}`).once("value");
    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }

    const lessonsSnapshot = await db.ref(`user_lessons/${username}`).once("value");
    const userLessons = lessonsSnapshot.val() || {};

    const allLessonsSnapshot = await db.ref("lessons").once("value");
    const allLessons = allLessonsSnapshot.val() || {};

    const lessonProgress = Object.entries(userLessons).map(([lessonId, lessonData]) => ({
      lesson_id: lessonId,
      title: allLessons[lessonId]?.title || lessonId,
      progress: lessonData.progress || 0,
      status: lessonData.status || "not_started",
    }));

    return lessonProgress;
  },

  async getLessonProgress(username, lessonId) {
    const db = admin.database();
    const snapshot = await db.ref(`user_lessons/${username}/${lessonId}`).once("value");
    const lesson = snapshot.val() || { progress: 0, status: "in_progress" };
    return {
      progress: lesson.progress || 0,
      status: lesson.status || "in_progress",
    };
  },

  async updateLessonProgress(username, lessonId, { progress, status }) {
    const db = admin.database();
    if (progress < 0 || progress > 100) {
      throw new Error("Progress must be between 0 and 100");
    }
    if (!["not_started", "in_progress", "completed"].includes(status)) {
      throw new Error("Invalid status");
    }

    const lessonRef = db.ref(`user_lessons/${username}/${lessonId}`);
    await lessonRef.set({ progress, status });
  },
};

module.exports = userLessonModel;