const lessonModel = require("../models/lessonModel");

const lessonController = {
  async getAllLessons(req, res) {
    try {
      const lessons = await lessonModel.getAllLessons();
      res.status(200).json(lessons);
    } catch (error) {
      console.error("Get lessons error:", error);
      res.status(500).json({ error: "Failed to fetch lessons", details: error.message });
    }
  },

  async addLesson(req, res) {
    try {
      const { lesson_id, title, description } = req.body;
      if (!lesson_id || !title || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const lesson = await lessonModel.addLesson({ lesson_id, title, description });
      res.status(201).json({ message: "Lesson created successfully", lesson });
    } catch (error) {
      console.error("Add lesson error:", error);
      res.status(500).json({ error: "Failed to create lesson", details: error.message });
    }
  },
};

module.exports = lessonController;