require("dotenv").config();
const { checkAndSendEmails } = require("./server.js");

(async () => {
  try {
    await checkAndSendEmails();
    process.exit(0);
  } catch (error) {
    console.error("❌ Cron job failed:", error);
    process.exit(1);
  }
})();
