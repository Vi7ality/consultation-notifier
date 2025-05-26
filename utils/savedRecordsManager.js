const { DateTime } = require("luxon");
const { cancelEmailNotification } = require("../services/sendpulse");
const { deleteSavedRec } = require("../services/redis");

const savedRecordsManager = async (savedRecordsList, dbRecords = []) => {
  const now = DateTime.now().setZone("Europe/Kyiv");

  for (const rec of savedRecordsList) {
    const eventDate = DateTime.fromISO(rec.eventDate, { zone: "Europe/Kyiv" });

    const existsInDb = dbRecords.some((dbRec) => {
      const dbEventDate = DateTime.fromISO(dbRec.eventDate, { zone: "Europe/Kyiv" });
      return dbRec.email === rec.email && dbEventDate.toISO() === eventDate.toISO();
    });

    if (eventDate < now && !existsInDb) {
      await deleteSavedRec(rec);
      console.log("🗑 Deleted old event:", rec);
    } else if (!existsInDb && rec.email) {
      await cancelEmailNotification(rec);
      await deleteSavedRec(rec);
      console.log("🚫 Canceled notification for:", rec.email, rec.EventDate);
    }
  }
};

module.exports = savedRecordsManager;
