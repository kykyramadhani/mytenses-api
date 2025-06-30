const userLessonModel = require("../models/userLessonModel");

const userLessonController = {
  async getAllLessonProgress(req, res) {
    try {
      const { username } = req.params;
      const lessonProgress = await userLessonModel.getAllLessonProgress(username);
      res.status(200).json({ lesson_progress: lessonProgress });
    } catch (error) {
      console.error("Get lesson progress error:", error);
      res.status(500).json({ error: "Failed to fetch lesson progress", details: error.message });
    }
  },

  async getLessonProgress(req, res) {
    try {
      const { username, lessonId } = req.params;
      const lesson = await userLessonModel.getLessonProgress(username, lessonId);
      res.status(200).json(lesson);
    } catch (error) {
      console.error("Get lesson progress error:", error);
      res.status(500).json({ error: "Failed to fetch lesson progress", details: error.message });
    }
  },

  async updateLessonProgress(req, res) {
    try {
      const { username, lessonId } = req.params;
      const { progress, status } = req.body;
      if (progress === undefined || !status) {
        return res.status(400).json({ error: "Missing required fields: progress, status" });
      }

      await userLessonModel.updateLessonProgress(username, lessonId, { progress, status });
      res.status(200).json({ message: "Lesson progress updated successfully" });
    } catch (error) {
      console.error("Update lesson progress error:", error);
      res.status(500).json({ error: "Failed to update progress", details: error.message });
    }
  },
};

module.exports = userLessonController;