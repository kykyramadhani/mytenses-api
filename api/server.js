const express = require('express');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const app = express();

// Ambil Firebase config dari environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: serviceAccount.databaseURL
});

const db = admin.database();
console.log('Database initialized:', db);

// Middleware untuk parsing JSON
app.use(express.json());

// Helper untuk menghasilkan ID user auto-increment
const getNextUserId = async () => {
  const counterRef = db.ref('counters/user_id');
  try {
    let newId;
    await counterRef.transaction((currentId) => {
      newId = (currentId || 0) + 1;
      return newId;
    });
    return newId;
  } catch (error) {
    console.error('Error in getNextUserId:', error);
    throw new Error('Failed to generate user ID');
  }
};

// API: Register User
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    // Cek apakah email sudah terdaftar
    const usersSnapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (usersSnapshot.exists()) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate ID user auto-increment
    const userId = await getNextUserId();
    const username = `user_${userId}`;

    const userRef = db.ref(`users/${username}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      user_id: userId,
      name,
      email,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      last_login: null,
      bio: '' // Initialize empty bio
    };

    await userRef.set(userData);
    res.status(201).json({ message: 'User registered successfully', user: { user_id: userId, name, email, username } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// API: Login User
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    // Cari pengguna berdasarkan email
    const usersSnapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!usersSnapshot.exists()) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Ambil data pengguna pertama yang cocok
    let userData, username;
    usersSnapshot.forEach((childSnapshot) => {
      username = childSnapshot.key;
      userData = childSnapshot.val();
    });

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last_login
    await db.ref(`users/${username}/last_login`).set(new Date().toISOString());

    res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email,
        username,
        bio: userData.bio || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// API: Change Password by Username
app.put('/api/users/:username/password', async (req, res) => {
  try {
    const { username } = req.params;
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Missing required fields: old_password, new_password' });
    }

    const userRef = db.ref(`users/${username}`);
    const userSnapshot = await userRef.once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userSnapshot.val();
    // Verifikasi kata sandi lama
    const isPasswordValid = await bcrypt.compare(old_password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    // Hash kata sandi baru
    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await userRef.update({ password: hashedNewPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
});

// API: Change Password by Email
app.put('/api/change-password-by-email', async (req, res) => {
  try {
    const { email, new_password } = req.body;

    // Validate input
    if (!email || !new_password) {
      return res.status(400).json({ error: 'Missing required fields: email, new_password' });
    }

    // Find user by email
    const usersSnapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!usersSnapshot.exists()) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Get the first matching user (email is unique, so there should be only one)
    let username;
    usersSnapshot.forEach((childSnapshot) => {
      username = childSnapshot.key;
    });

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Update password in the database
    await db.ref(`users/${username}`).update({ password: hashedNewPassword });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password by email error:', error);
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
});

// API: Ambil Data User
app.get('/api/users/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Ambil data pengguna
    const userSnapshot = await db.ref(`users/${username}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ambil data lessons pengguna
    const lessonsSnapshot = await db.ref(`user_lessons/${username}`).once('value');
    const scoresSnapshot = await db.ref('quiz_scores').orderByChild('user_id').equalTo(username).once('value');

    // Ambil semua data lessons untuk mendapatkan title
    const allLessonsSnapshot = await db.ref('lessons').once('value');

    const userData = userSnapshot.val();
    const userLessons = lessonsSnapshot.val() || {};
    const allLessons = allLessonsSnapshot.val() || {};

    // Get completed lessons
    const completedLessons = Object.entries(userLessons)
      .filter(([_, lesson]) => lesson.status === 'completed')
      .map(([lessonId, _]) => ({
        lesson_id: lessonId,
        title: allLessons[lessonId]?.title || lessonId
      }));

    // Prepare profile response
    const profile = {
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      username,
      bio: userData.bio || '',
      completed_lessons: completedLessons,
      lessons: userLessons,
      quiz_scores: scoresSnapshot.val() || {}
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error('Get user error:', error);
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
    console.error('Update lesson progress error:', error);
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
    console.error('Add quiz score error:', error);
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
    console.error('Get lessons error:', error);
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
    console.error('Add lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson', details: error.message });
  }
});

// API: Tambah Materi ke Kelas
app.post('/api/materials', async (req, res) => {
  try {
    const { lesson_id, chapter_title, explanation, formulas, examples } = req.body;
    if (!lesson_id || !chapter_title || !explanation) {
      return res.status(400).json({ error: 'Missing required fields: lesson_id, chapter_title, explanation' });
    }

    const materialRef = db.ref('materials').push();
    const materialData = {
      material_id: materialRef.key,
      lesson_id,
      chapter_title,
      explanation,
      formulas: formulas || [],
      examples: examples || []
    };

    await materialRef.set(materialData);
    res.status(201).json({ message: 'Material added successfully', material: materialData });
  } catch (error) {
    console.error('Add material error:', error);
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
    console.error('Add quiz error:', error);
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
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question', details: error.message });
  }
});

// API: Get All Questions
app.get('/api/questions', async (req, res) => {
  try {
    const questionsSnapshot = await db.ref('questions').once('value');
    const questions = questionsSnapshot.val() || {};

    // Ubah objek menjadi array untuk respons yang lebih mudah diproses
    const questionsArray = Object.values(questions);

    res.status(200).json({ questions: questionsArray });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});

// API: PUT Points Questions
app.patch('/api/questions/:questionId', (req, res) => {
    const questionId = req.params.questionId;
    const { points } = req.body;

    if (!points || isNaN(points)) {
        return res.status(400).json({ error: 'Points is required and must be a number' });
    }

    db.ref(`questions/${questionId}`).update({ points: Number(points) })
        .then(() => {
            res.json({ message: 'Points updated successfully' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'Failed to update points', details: error.message });
        });
});

// API: Delete User
app.delete('/api/users/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userRef = db.ref(`users/${username}`);
    const snapshot = await userRef.once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.remove();
    await db.ref(`user_lessons/${username}`).remove();
    await db.ref('quiz_scores').orderByChild('user_id').equalTo(username).remove();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const materialsSnapshot = await db.ref('materials').once('value');
    const materials = materialsSnapshot.val() || {};
    const materialsArray = Object.values(materials);
    res.status(200).json({ materials: materialsArray });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials', details: error.message });
  }
});

app.put('/api/users/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const { name, bio } = req.body;

    // Periksa apakah pengguna ada
    const userSnapshot = await db.ref(`users/${username}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Siapkan data untuk update
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name || null;
    }
    if (bio !== undefined) {
      updateData.bio = bio || null;
    }

    // Update data pengguna jika ada perubahan
    if (Object.keys(updateData).length > 0) {
      await db.ref(`users/${username}`).update(updateData);
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

module.exports = app;