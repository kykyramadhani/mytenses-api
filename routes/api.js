const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const lessonController = require("../controllers/lessonController");
const materialController = require("../controllers/materialController");
const quizController = require("../controllers/quizController");
const questionController = require("../controllers/questionController");
const quizScoreController = require("../controllers/quizScoreController");
const userLessonController = require("../controllers/userLessonController");
const notificationController = require("../controllers/notificationController");

// User Routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.put("/users/:username/password", userController.changePasswordByUsername);
router.put("/change-password-by-email", userController.changePasswordByEmail);
router.get("/users/:username", userController.getUser);
router.delete("/users/:username", userController.deleteUser);
router.put("/users/:username", userController.updateUser);
router.put("/users/:username/token", userController.updateFcmToken);

// Lesson Routes
router.get("/lessons", lessonController.getAllLessons);
router.post("/lessons", lessonController.addLesson);

// Material Routes
router.get("/materials", materialController.getAllMaterials);
router.post("/materials", materialController.addMaterial);
router.delete("/materials/:materialId", materialController.deleteMaterial);
router.put("/materials/:materialId", materialController.updateMaterial);

// Quiz Routes
router.post("/quizzes", quizController.addQuiz);

// Question Routes
router.get("/questions", questionController.getAllQuestions);
router.post("/questions", questionController.addQuestion);

// Quiz Score Routes
router.post("/quiz_scores", quizScoreController.addQuizScore);

// User Lesson Routes
router.get("/users/:username/lessons", userLessonController.getAllLessonProgress);
router.get("/users/:username/lessons/:lessonId", userLessonController.getLessonProgress);
router.put("/users/:username/lessons/:lessonId", userLessonController.updateLessonProgress);

// Notification Routes
router.post("/trigger-notif", notificationController.triggerNotification);

module.exports = router;