require("dotenv").config();
const cron = require("node-cron");
const { DateTime } = require("luxon");
const { readData, addUser, deleteByEmail } = require("./services/jsonService");
const { cancelEmailNotification, scheduleEmailNotification } = require("./services/sendpulse");
const { fetchDataBase } = require("./services/database");
const { formatDate } = require("./utils");

// const fakeData = "./data/fakeData.json";
const savedRecords = "./data/savedRecords.json";

const PORT = process.env.PORT || 3000;

let prevDate = DateTime.now().setZone("Europe/Kyiv");

const getRecordsList = (data) =>
  data.map(({ client, startDate, createDate }) => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    eventDate: formatDate(startDate),
    createDate: formatDate(createDate),
  }));

const filterNewRecords = (records, lastChecked) =>
  records.filter(({ createDate }) => {
    const create = DateTime.fromISO(createDate, { zone: "Europe/Kyiv" });
    return create > lastChecked;
  });

const checkAndSendEmails = async () => {
  try {
    // const data = await readData(fakeData);
    const data = await fetchDataBase();
    const recordList = getRecordsList(data);
    const savedRecordsList = readData(savedRecords);
    const now = DateTime.now().setZone("Europe/Kyiv");

    savedRecordsList.forEach((rec) => {
      const eventDate = DateTime.fromISO(rec.eventDate, { zone: "Europe/Kyiv" });

      if (eventDate < now) {
        deleteByEmail(rec.email, savedRecords);
        console.log("Deleted old event:", rec);
      } else if (
        !recordList.some(
          ({ email, eventDate }) => email === rec.email && eventDate === rec.eventDate
        )
      ) {
        cancelEmailNotification(rec);
        deleteByEmail(rec.email, savedRecords);
        console.log("Canceled notification for:", rec.email);
      }
    });

    const newRecords = filterNewRecords(recordList, prevDate);

    if (newRecords.length > 0) {
      console.log("New records found:", newRecords);
      newRecords.forEach((rec) => {
        scheduleEmailNotification(rec);
        addUser(rec, savedRecords);
      });
    }

    prevDate = now;
  } catch (error) {
    console.error("Error checking and sending emails:", error.message);
  }
};

cron.schedule("*/5 * * * *", async () => {
  console.log(
    "Checking API data:",
    DateTime.now().setZone("Europe/Kyiv").toLocaleString(DateTime.DATETIME_SHORT)
  );
  await checkAndSendEmails();
});
