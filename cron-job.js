const { checkAndSendEmails } = require("./server.js");
(async () => {
  await checkAndSendEmails();
})();
