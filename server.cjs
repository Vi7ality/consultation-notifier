require("dotenv").config();
const cron = require("node-cron");
const { DateTime } = require("luxon");
const { getUsers, addUser, deleteSavedRec } = require("./services/redis");
const { readData } = require("./services/jsonService");
const { cancelEmailNotification, scheduleEmailNotification } = require("./services/sendpulse");
const { fetchDataBase } = require("./services/database");
const { formatDate } = require("./utils");

// const fakeData = "./data/fakeData.json";

const getRecordsList = (data) =>
  data.map(({ client, startDate, createDate, resultProcedures, courses }) => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    eventDate: formatDate(startDate),
    createDate: formatDate(createDate),
    cause: resultProcedures[0]?.procedureName || courses[0]?.title || "",
  }));

const filterNewRecords = (records, savedRecordsList) =>
  records.filter((rec) => {
    return !savedRecordsList.some(
      (savedRec) => savedRec.email === rec.email && savedRec.eventDate === rec.eventDate
    );
  });

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

    // const data = await readData(fakeData);

    if (data.length === 0) {
      console.log("No record was found");
      await manageSavedRecords(savedRecordsList);
      return;
    }

    const recordList = getRecordsList(data);

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
checkAndSendEmails();

// cron.schedule("*/5 * * * *", async () => {
//   console.log(
//     "Checking API data:",
//     DateTime.now().setZone("Europe/Kyiv").toLocaleString(DateTime.DATETIME_SHORT)
//   );
//   await checkAndSendEmails();
// });
