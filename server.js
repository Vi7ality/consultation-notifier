require("dotenv").config();
const cron = require("node-cron");
const { readData, addUser, deleteByEmail } = require("./services/jsonService");
const { cancelEmailNotification, scheduleEmailNotification } = require("./services/sendpulse");
const { formatDate } = require("./utils");
const { fetchDataBase } = require("./services/database");

const fakeData = "./data/fakeData.json";
const savedRecords = "./data/savedRecords.json";

let prevDate = new Date();

const getRecordsList = (data) =>
  data.map(({ client, startDate, createDate }) => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    eventDate: formatDate(startDate),
    createDate: formatDate(createDate),
  }));

const filterNewRecords = (records, lastChecked) =>
  records.filter(({ createDate }) => new Date(createDate) > lastChecked);

const checkAndSendEmails = async () => {
  try {
    const data = await readData(fakeData);
    // const data = await fetchDataBase();
    const recordList = getRecordsList(data);
    const savedRecordsList = readData(savedRecords);
    const now = new Date();

    savedRecordsList.forEach((rec) => {
      const eventDate = new Date(rec.eventDate);

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

cron.schedule("*/1 * * * *", async () => {
  console.log("Checking API data:", new Date().toISOString());
  await checkAndSendEmails();
});
