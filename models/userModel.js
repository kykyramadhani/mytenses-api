const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const counterModel = require("./counterModel");

const userModel = {
  async register({ name, email, password }) {
    const db = admin.database();
    const usersSnapshot = await db.ref("users").orderByChild("email").equalTo(email).once("value");
    if (usersSnapshot.exists()) {
      throw new Error("Email already exists");
    }

    const userId = await counterModel.getNextUserId();
    const username = `user_${userId}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      user_id: userId,
      name,
      email,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      last_login: null,
      bio: "",
    };

    await db.ref(`users/${username}`).set(userData);
    return { user_id: userId, name, email, username };
  },

  async login({ email, password, fcm_token }) {
    const db = admin.database();
    const usersSnapshot = await db.ref("users").orderByChild("email").equalTo(email).once("value");
    if (!usersSnapshot.exists()) {
      throw new Error("Invalid email or password");
    }

    let userData, username;
    usersSnapshot.forEach((childSnapshot) => {
      username = childSnapshot.key;
      userData = childSnapshot.val();
    });

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const updates = {
      last_login: new Date().toISOString(),
    };
    if (fcm_token) {
      updates.fcm_token = fcm_token;
    }

    await db.ref(`users/${username}`).update(updates);
    return {
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      username,
      bio: userData.bio || "",
      fcm_token: fcm_token || null,
    };
  },

  async changePasswordByUsername(username, old_password, new_password) {
    const db = admin.database();
    const userRef = db.ref(`users/${username}`);
    const userSnapshot = await userRef.once("value");
    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnapshot.val();
    const isPasswordValid = await bcrypt.compare(old_password, userData.password);
    if (!isPasswordValid) {
      throw new Error("Invalid old password");
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await userRef.update({ password: hashedNewPassword });
  },

  async changePasswordByEmail(email, new_password) {
    const db = admin.database();
    const usersSnapshot = await db.ref("users").orderByChild("email").equalTo(email).once("value");
    if (!usersSnapshot.exists()) {
      throw new Error("Email not found");
    }

    let username;
    usersSnapshot.forEach((childSnapshot) => {
      username = childSnapshot.key;
    });

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await db.ref(`users/${username}`).update({ password: hashedNewPassword });
  },

  async getUser(username) {
    const db = admin.database();
    const userSnapshot = await db.ref(`users/${username}`).once("value");
    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }

    const lessonsSnapshot = await db.ref(`user_lessons/${username}`).once("value");
    const scoresSnapshot = await db.ref("quiz_scores").orderByChild("user_id").equalTo(username).once("value");
    const allLessonsSnapshot = await db.ref("lessons").once("value");

    const userData = userSnapshot.val();
    const userLessons = lessonsSnapshot.val() || {};
    const allLessons = allLessonsSnapshot.val() || {};

    const completedLessons = Object.entries(userLessons)
      .filter(([_, lesson]) => lesson.status === "completed")
      .map(([lessonId, _]) => ({
        lesson_id: lessonId,
        title: allLessons[lessonId]?.title || lessonId,
      }));

    return {
      user_id: userData.user_id,
      name: userData.name,
      email: userData.email,
      username,
      bio: userData.bio || "",
      completed_lessons: completedLessons,
      lessons: userLessons,
      quiz_scores: scoresSnapshot.val() || {},
    };
  },

  async deleteUser(username) {
    const db = admin.database();
    const userRef = db.ref(`users/${username}`);
    const snapshot = await userRef.once("value");
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }

    await userRef.remove();
    await db.ref(`user_lessons/${username}`).remove();
    await db.ref("quiz_scores").orderByChild("user_id").equalTo(username).remove();
  },

  async updateUser(username, { name, bio }) {
    const db = admin.database();
    const userRef = db.ref(`users/${username}`);
    const userSnapshot = await userRef.once("value");
    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name || null;
    if (bio !== undefined) updateData.bio = bio || null;

    if (Object.keys(updateData).length > 0) {
      await userRef.update(updateData);
    }
  },

  async updateFcmToken(username, fcm_token) {
    const db = admin.database();
    const userRef = db.ref(`users/${username}`);
    const snapshot = await userRef.once("value");
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }

    await userRef.update({ fcm_token });
  },
};

module.exports = userModel;