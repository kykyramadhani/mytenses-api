const quizModel = require("../models/quizModel");

const quizController = {
  async addQuiz(req, res) {
    try {
      const { lesson_id, quiz_id, title, total_points } = req.body;
      if (!lesson_id || !quiz_id || !title || !total_points) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const quiz = await quizModel.addQuiz({ lesson_id, quiz_id, title, total_points });
      res.status(201).json({ message: "Quiz added successfully", quiz });
    } catch (error) {
      console.error("Add quiz error:", error);
      res.status(500).json({ error: "Failed to add quiz", details: error.message });
    }
  },
};

module.exports = quizController;