const admin = require("firebase-admin");
const db = admin.database();

const counterModel = {
  async getNextUserId() {
    const counterRef = db.ref("counters/user_id");
    try {
      let newId;
      await counterRef.transaction((currentId) => {
        newId = (currentId || 0) + 1;
        return newId;
      });
      return newId;
    } catch (error) {
      console.error("Error in getNextUserId:", error);
      throw new Error("Failed to generate user ID");
    }
  },
};

module.exports = counterModel;