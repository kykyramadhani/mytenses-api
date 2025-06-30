const userModel = require("../models/userModel");

const userController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields: name, email, password" });
      }

      const user = await userModel.register({ name, email, password });
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register user", details: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password, fcm_token } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields: email, password" });
      }

      const user = await userModel.login({ email, password, fcm_token });
      res.status(200).json({ message: "Login successful", user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login", details: error.message });
    }
  },

  async changePasswordByUsername(req, res) {
    try {
      const { username } = req.params;
      const { old_password, new_password } = req.body;
      if (!old_password || !new_password) {
        return res.status(400).json({ error: "Missing required fields: old_password, new_password" });
      }

      await userModel.changePasswordByUsername(username, old_password, new_password);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to update password", details: error.message });
    }
  },

  async changePasswordByEmail(req, res) {
    try {
      const { email, new_password } = req.body;
      if (!email || !new_password) {
        return res.status(400).json({ error: "Missing required fields: email, new_password" });
      }

      await userModel.changePasswordByEmail(email, new_password);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password by email error:", error);
      res.status(500).json({ error: "Failed to update password", details: error.message });
    }
  },

  async getUser(req, res) {
    try {
      const { username } = req.params;
      const profile = await userModel.getUser(username);
      res.status(200).json(profile);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user", details: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const { username } = req.params;
      await userModel.deleteUser(username);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user", details: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const { username } = req.params;
      const { name, bio } = req.body;
      await userModel.updateUser(username, { name, bio });
      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user", details: error.message });
    }
  },

  async updateFcmToken(req, res) {
    try {
      const { username } = req.params;
      const { fcm_token } = req.body;
      if (!fcm_token) {
        return res.status(400).json({ error: "Missing fcm_token" });
      }

      await userModel.updateFcmToken(username, fcm_token);
      res.status(200).json({ message: "FCM token updated successfully" });
    } catch (error) {
      console.error("Update FCM token error:", error);
      res.status(500).json({ error: "Failed to update FCM token", details: error.message });
    }
  },
};

module.exports = userController;