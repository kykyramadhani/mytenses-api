const questionModel = require("../models/questionModel");

const questionController = {
  async getAllQuestions(req, res) {
    try {
      const questions = await questionModel.getAllQuestions();
      res.status(200).json({ questions });
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ error: "Failed to fetch questions", details: error.message });
    }
  },

  async addQuestion(req, res) {
    try {
      const { quiz_id, text, options, correct_option, points } = req.body;
      if (!quiz_id || !text || !options || !correct_option || !points) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const question = await questionModel.addQuestion({ quiz_id, text, options, correct_option, points });
      res.status(201).json({ message: "Question added successfully", question });
    } catch (error) {
      console.error("Add question error:", error);
      res.status(500).json({ error: "Failed to add question", details: error.message });
    }
  },
};

module.exports = questionController;