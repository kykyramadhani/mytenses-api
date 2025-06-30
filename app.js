const express = require("express");
const admin = require("firebase-admin");
const apiRoutes = require("./routes/api");

const app = express();

// Inisialisasi Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: serviceAccount.databaseURL,
});

const db = admin.database();
console.log("Database initialized:", db);

// Middleware
app.use(express.json());

// Route API
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;