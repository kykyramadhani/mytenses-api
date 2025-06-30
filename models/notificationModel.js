const admin = require("firebase-admin");

const randomMessages = [
  { title: "Belajar Hari Ini", body: "Yuk lanjutkan belajar tensis kamu!" },
  { title: "Tips Belajar", body: "Ulangi pelajaran kemarin agar makin paham!" },
  { title: "Semangat!", body: "Hari baru, semangat baru! Belajar yuk!" },
  { title: "Tenses Time!", body: "Sikat lagi pelajaran tenses biar jago!" },
  { title: "Jangan Kendor!", body: "Kamu udah setengah jalan, lanjutkan!" },
  { title: "Paham Tenses", body: "Satu tenses dikuasai, tinggal 15 lagi!" },
  { title: "Gaspol Belajar!", body: "Jangan biarin tenses bikin bingung, ayo selesaikan!" },
  { title: "Level Up!", body: "Progress kamu ngegas, lanjut ke pelajaran berikutnya!" },
  { title: "Tantangan Baru", body: "Siap taklukkan tenses berikutnya? Yuk mulai!" },
  { title: "Jadi Master", body: "Latihan terus, kamu bakal jago tenses!" },
  { title: "Belajar Keren", body: "Tenses gampang kalo kamu rajin latihan!" },
  { title: "Keep Going!", body: "Kamu udah bagus banget, lanjutkan progressnya!" },
  { title: "Hajar Tenses!", body: "Jangan takut sama tenses, kamu bisa!" },
  { title: "Pelajaran Seru", body: "Ayo cek pelajaran baru, seru banget!" },
  { title: "Progres Mantap", body: "Wow, kamu udah sejauh ini! Lanjut yok!" },
  { title: "Tenses Gampang", body: "Latihan sedikit lagi, tenses bakal nempel di kepala!" },
  { title: "Siap Quiz?", body: "Uji kemampuan tenses kamu sekarang!" },
  { title: "Belajar Santai", body: "Tenang aja, pelan-pelan pasti paham!" },
  { title: "Jadi Pro", body: "Satu langkah lagi menuju master tenses!" },
  { title: "Yuk Latihan!", body: "Keren banget progressnya, lanjut latihan!" },
];

const notificationModel = {
  async triggerNotification() {
    const db = admin.database();
    const usersSnapshot = await db.ref("users").once("value");
    const logs = [];
    let successCount = 0;
    let failedCount = 0;

    const promises = [];
    usersSnapshot.forEach((child) => {
      const user = child.val();
      const fcmToken = user.fcm_token;
      const username = child.key;

      if (fcmToken) {
        const randomNotif = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        const message = {
          token: fcmToken,
          notification: {
            title: randomNotif.title,
            body: randomNotif.body,
          },
          android: {
            priority: "high",
          },
        };

        promises.push(
          admin.messaging().send(message)
            .then(() => {
              logs.push({ username, notif: randomNotif, status: "success" });
              successCount++;
            })
            .catch((error) => {
              if (error.code === "messaging/registration-token-not-registered") {
                console.log(`Token untuk user ${username} invalid, menghapus...`);
                db.ref(`users/${username}/fcm_token`).remove();
                logs.push({ username, notif: randomNotif, status: "failed", error: "Invalid token, removed" });
              } else {
                logs.push({ username, notif: randomNotif, status: "failed", error: error.message });
              }
              failedCount++;
            })
        );
      } else {
        logs.push({ username, status: "skipped", error: "No FCM token" });
        failedCount++;
      }
    });

    await Promise.allSettled(promises);
    return { successCount, failedCount, total: usersSnapshot.numChildren(), logs };
  },
};

module.exports = notificationModel;