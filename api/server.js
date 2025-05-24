const express = require('express');
const admin = require('firebase-admin');
const app = express();
const port = 3000;

// Inisialisasi Firebase Admin SDK
const serviceAccount = require('../firebase-config.json');
console.log('Database URL from config:', serviceAccount.databaseURL); // Debug
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: serviceAccount.databaseURL // Pastikan dibaca dari config
});

const db = admin.database();
console.log('Database initialized:', db); // Debug

// Middleware untuk parsing JSON
app.use(express.json());

// Helper untuk hash password (sederhana, idealnya pakai bcrypt)
const hashPassword = (password) => {
  return require('crypto').createHash('sha256').update(password).digest('hex');
};

// API: Tambah User
app.post('/api/users', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userRef = db.ref(`users/${username}`);
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const userData = {
      username,
      name,
      email,
      password: hashPassword(password),
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    await userRef.set(userData);
    res.status(201).json({ message: 'User created successfully', user: userData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// API: Ambil Data User
app.get('/api/users/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userSnapshot = await db.ref(`users/${username}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    const lessonsSnapshot = await db.ref(`user_lessons/${username}`).once('value');
    const scoresSnapshot = await db.ref('quiz_scores').orderByChild('user_id').equalTo(username).once('value');

    const userData = userSnapshot.val();
    userData.lessons = lessonsSnapshot.val() || {};
    userData.quiz_scores = scoresSnapshot.val() || {};

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// API: Update Progress Kelas User
app.put('/api/users/:username/lessons/:lessonId', async (req, res) => {
  try {
    const { username, lessonId } = req.params;
    const { progress, status } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lessonRef = db.ref(`user_lessons/${username}/${lessonId}`);
    await lessonRef.set({ progress, status });
    res.status(200).json({ message: 'Lesson progress updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress', details: error.message });
  }
});

// API: Tambah Skor Kuis
app.post('/api/quiz_scores', async (req, res) => {
  try {
    const { user_id, quiz_id, score, date_taken } = req.body;

    if (!user_id || !quiz_id || score === undefined || !date_taken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scoreRef = db.ref('quiz_scores').push();
    const scoreData = {
      score_id: scoreRef.key,
      user_id,
      quiz_id,
      score,
      date_taken: date_taken || new Date().toISOString()
    };

    await scoreRef.set(scoreData);
    res.status(201).json({ message: 'Quiz score added successfully', score: scoreData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add quiz score', details: error.message });
  }
});

// API: Ambil Semua Kelas
app.get('/api/lessons', async (req, res) => {
  try {
    const lessonsSnapshot = await db.ref('lessons').once('value');
    const materialsSnapshot = await db.ref('materials').once('value');
    const quizzesSnapshot = await db.ref('quizzes').once('value');
    const questionsSnapshot = await db.ref('questions').once('value');

    const lessons = lessonsSnapshot.val() || {};
    const materials = materialsSnapshot.val() || {};
    const quizzes = quizzesSnapshot.val() || {};
    const questions = questionsSnapshot.val() || {};

    // Gabungkan data
    Object.keys(lessons).forEach(lessonId => {
      lessons[lessonId].materials = {};
      lessons[lessonId].quizzes = {};

      // Tambah materials berdasarkan lesson_id
      Object.keys(materials).forEach(materialId => {
        if (materials[materialId].lesson_id === lessonId) {
          lessons[lessonId].materials[materialId] = materials[materialId];
        }
      });

      // Tambah quizzes berdasarkan lesson_id
      Object.keys(quizzes).forEach(quizId => {
        if (quizzes[quizId].lesson_id === lessonId) {
          quizzes[quizId].questions = {};
          // Tambah questions berdasarkan quiz_id
          Object.keys(questions).forEach(questionId => {
            if (questions[questionId].quiz_id === quizId) {
              quizzes[quizId].questions[questionId] = questions[questionId];
            }
          });
          lessons[lessonId].quizzes[quizId] = quizzes[quizId];
        }
      });
    });

    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons', details: error.message });
  }
});

// API: Tambah Kelas
app.post('/api/lessons', async (req, res) => {
  try {
    const { lesson_id, title, description } = req.body;
    if (!lesson_id || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lessonRef = db.ref(`lessons/${lesson_id}`);
    const snapshot = await lessonRef.once('value');
    if (snapshot.exists()) {
      return res.status(400).json({ error: 'Lesson already exists' });
    }

    const lessonData = { lesson_id, title, description };
    await lessonRef.set(lessonData);
    res.status(201).json({ message: 'Lesson created successfully', lesson: lessonData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lesson', details: error.message });
  }
});

// API: Tambah Materi ke Kelas
app.post('/api/materials', async (req, res) => {
  try {
    const { lesson_id, chapter_title, explanation, formulas } = req.body;
    if (!lesson_id || !chapter_title || !explanation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const materialRef = db.ref('materials').push();
    const materialData = {
      material_id: materialRef.key,
      lesson_id,
      chapter_title,
      explanation,
      formulas: formulas || []
    };

    await materialRef.set(materialData);
    res.status(201).json({ message: 'Material added successfully', material: materialData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add material', details: error.message });
  }
});

// API: Tambah Kuis ke Kelas
app.post('/api/quizzes', async (req, res) => {
  try {
    const { lesson_id, quiz_id, title, total_points } = req.body;
    if (!lesson_id || !quiz_id || !title || !total_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quizRef = db.ref(`quizzes/${quiz_id}`);
    const quizData = { quiz_id, lesson_id, title, total_points };
    await quizRef.set(quizData);
    res.status(201).json({ message: 'Quiz added successfully', quiz: quizData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add quiz', details: error.message });
  }
});

// API: Tambah Pertanyaan ke Kuis
app.post('/api/questions', async (req, res) => {
  try {
    const { quiz_id, text, options, correct_option, points } = req.body;
    if (!quiz_id || !text || !options || !correct_option || !points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const questionRef = db.ref('questions').push();
    const questionData = {
      question_id: questionRef.key,
      quiz_id,
      text,
      options,
      correct_option,
      points
    };

    await questionRef.set(questionData);
    res.status(201).json({ message: 'Question added successfully', question: questionData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add question', details: error.message });
  }
});

// API: Delete User
app.delete('/api/users/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userRef = db.ref(`users/${username}`);
    const snapshot = await userRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.remove();
    await db.ref(`user_lessons/${username}`).remove();
    await db.ref('quiz_scores').orderByChild('user_id').equalTo(username).remove();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

module.exports = app;

