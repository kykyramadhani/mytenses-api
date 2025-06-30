const quizScoreModel = require("../models/quizScoreModel");

const quizScoreController = {
  async addQuizScore(req, res) {
    try {
      const { user_id, quiz_id, score, date_taken } = req.body;
      if (!user_id || !quiz_id || score === undefined || !date_taken) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const scoreData = await quizScoreModel.addQuizScore({ user_id, quiz_id, score, date_taken });
      res.status(201).json({ message: "Quiz score added successfully", score: scoreData });
    } catch (error) {
      console.error("Add quiz score error:", error);
      res.status(500).json({ error: "Failed to add quiz score", details: error.message });
    }
  },
};

module.exports = quizScoreController;