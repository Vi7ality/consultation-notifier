require("dotenv").config();
const cron = require("node-cron");
const { DateTime } = require("luxon");
const { getUsers, addUser, deleteByEmail } = require("./services/redis");
const { readData } = require("./services/jsonService");
const { cancelEmailNotification, scheduleEmailNotification } = require("./services/sendpulse");
const { fetchDataBase } = require("./services/database");
const { formatDate } = require("./utils");

// const fakeData = "./data/fakeData.json";

let prevDate = DateTime.now().setZone("Europe/Kyiv");

const getRecordsList = (data) =>
  data.map(({ client, startDate, createDate, resultProcedures, courses }) => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    eventDate: formatDate(startDate),
    createDate: formatDate(createDate),
    cause: resultProcedures?.description || courses?.title || "",
  }));

const filterNewRecords = (records, lastChecked) =>
  records.filter(({ createDate }) => {
    const create = DateTime.fromISO(createDate, { zone: "Europe/Kyiv" });
    return create > lastChecked;
  });

const manageSavedRecords = async (dbRecords = []) => {
  const savedRecordsList = await getUsers();
  const now = DateTime.now().setZone("Europe/Kyiv");

  for (const rec of savedRecordsList) {
    const eventDate = DateTime.fromISO(rec.eventDate, { zone: "Europe/Kyiv" });

    if (eventDate < now) {
      await deleteByEmail(rec.email);
      console.log("🗑 Deleted old event:", rec);
    } else if (
      !dbRecords.some((dbRec) => {
        const dbEventDate = DateTime.fromISO(dbRec.eventDate, { zone: "Europe/Kyiv" });
        return dbRec.email === rec.email && dbEventDate.toISO() === eventDate.toISO();
      })
    ) {
      await cancelEmailNotification(rec);
      await deleteByEmail(rec.email);
      console.log("🚫 Canceled notification for:", rec.email);
    }
  }
};

const checkAndSendEmails = async () => {
  try {
    const data = await fetchDataBase();
    // const data = await readData(fakeData);
    const now = DateTime.now().setZone("Europe/Kyiv");

    if (data.length === 0) {
      console.log("No record was found");
      await manageSavedRecords();
      return;
    }

    const recordList = getRecordsList(data);

    await manageSavedRecords(recordList);

    const newRecords = filterNewRecords(recordList, prevDate);

    if (newRecords.length > 0) {
      console.log("New records found:", newRecords);
      for (const rec of newRecords) {
        await scheduleEmailNotification(rec);
        await addUser({
          name: rec.name,
          email: rec.email,
          phone: rec.phone,
          eventDate: rec.eventDate,
        });
      }
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
