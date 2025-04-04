require("dotenv").config();
const cron = require("node-cron");
const express = require("express");
const { DateTime } = require("luxon");
const { readData, addUser, deleteByEmail } = require("./services/jsonService");
const { cancelEmailNotification, scheduleEmailNotification } = require("./services/sendpulse");
const { fetchDataBase } = require("./services/database");

// const fakeData = "./data/fakeData.json";
const savedRecords = "./data/savedRecords.json";

const app = express();
const PORT = process.env.PORT || 3000;

let prevDate = DateTime.now().setZone("Europe/Kyiv");

const getRecordsList = (data) =>
  data.map(({ client, startDate, createDate }) => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    eventDate: DateTime.fromISO(startDate, { zone: "Europe/Kyiv" }),
    createDate: DateTime.fromISO(createDate, { zone: "Europe/Kyiv" }),
  }));

const filterNewRecords = (records, lastChecked) =>
  records.filter(({ createDate }) => createDate > lastChecked);

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
          ({ email, eventDate: evDate }) => email === rec.email && evDate.toISO() === rec.eventDate
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
        addUser(
          {
            ...rec,
            eventDate: rec.eventDate.toISO(),
            createDate: rec.createDate.toISO(),
          },
          savedRecords
        );
      });
    }

    prevDate = now;
  } catch (error) {
    console.error("Error checking and sending emails:", error.message);
  }
};

cron.schedule("*/1 * * * *", async () => {
  console.log(
    "Checking API data:",
    DateTime.now().setZone("Europe/Kyiv").toLocaleString(DateTime.DATETIME_SHORT)
  );
  await checkAndSendEmails();
});

app.listen(PORT, () => {
  console.log("Server is running!");
});
