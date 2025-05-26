require("dotenv").config();

const { DateTime } = require("luxon");
const { getUsers, addUser, deleteSavedRec } = require("./services/redis");
const { scheduleEmailNotification, createSPContact } = require("./services/sendpulse");
const { fetchDataBase } = require("./services/database");
const createRecordList = require("./utils/createRecordList");
const filterNewRecords = require("./utils/filterNewRecords");
const { savedRecordsManager } = require("./utils");

const checkAndSendEmails = async () => {
  try {
    const data = await fetchDataBase();
    const savedRecordsList = await getUsers();

    if (data.length === 0) {
      console.log("No record was found");
      await savedRecordsManager(savedRecordsList);
      return;
    }

    const recordList = createRecordList(data);

    await savedRecordsManager(savedRecordsList, recordList);

    const newRecords = filterNewRecords(recordList, savedRecordsList);

    for (const rec of newRecords) {
      savedRecordsList.push(rec);
    }
    console.log("newRecords", newRecords.length);

    if (newRecords.length > 0) {
      for (const rec of newRecords) {
        const eventDate = DateTime.fromISO(rec.eventDate, { zone: "Europe/Kyiv" });
        const now = DateTime.now().setZone("Europe/Kyiv");
        if (eventDate > now && rec.email) {
          await scheduleEmailNotification(rec);
          await createSPContact(rec);
        } else console.warn(`Email not provided`);
        await addUser({
          name: rec.name,
          email: rec.email,
          phone: rec.phone,
          eventDate: rec.eventDate,
        });
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
