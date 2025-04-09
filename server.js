require("dotenv").config();

const { DateTime } = require("luxon");
const { getUsers, addUser, deleteSavedRec } = require("./services/redis");
const {
  cancelEmailNotification,
  scheduleEmailNotification,
  createSPContact,
} = require("./services/sendpulse");
const { fetchDataBase } = require("./services/database");
const createRecordList = require("./utils/createRecordList");
const filterNewRecords = require("./utils/filterNewRecords");

const manageSavedRecords = async (savedRecordsList, dbRecords = []) => {
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
    } else if (!existsInDb) {
      await cancelEmailNotification(rec);
      await deleteSavedRec(rec);
      console.log("🚫 Canceled notification for:", rec.email, rec.EventDate);
    }
  }
};

const checkAndSendEmails = async () => {
  try {
    const data = await fetchDataBase();
    const savedRecordsList = await getUsers();

    if (data.length === 0) {
      console.log("No record was found");
      await manageSavedRecords(savedRecordsList);
      return;
    }

    const recordList = createRecordList(data);

    await manageSavedRecords(savedRecordsList, recordList);

    const newRecords = filterNewRecords(recordList, savedRecordsList);

    for (const rec of newRecords) {
      savedRecordsList.push(rec);
    }
    console.log("newRecords", newRecords.length);

    if (newRecords.length > 0) {
      for (const rec of newRecords) {
        const eventDate = DateTime.fromISO(rec.eventDate, { zone: "Europe/Kyiv" });
        const now = DateTime.now().setZone("Europe/Kyiv");
        if (eventDate > now) {
          await scheduleEmailNotification(rec);
          await createSPContact(rec);
          await addUser({
            name: rec.name,
            email: rec.email,
            phone: rec.phone,
            eventDate: rec.eventDate,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking and sending emails:", error.message);
  }
};

console.log(
  "Checking API data:",
  DateTime.now().setZone("Europe/Kyiv").toLocaleString(DateTime.DATETIME_SHORT)
);

module.exports = { checkAndSendEmails };
