require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const { readData, addUser, deleteByEmail } = require("./services/jsonService");
const { cancelEmailNotification, scheduleEmailNotification } = require("./services/sendpulse");

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

axios.defaults.baseURL = API_URL;

const fakeData = "./data/fakeData.json";
const savedRecords = "./data/savedRecords.json";

let prevDate;

const getAuthToken = async () => {
  try {
    const res = await axios.get(`/api2/login/?username=${LOGIN}&password=${PASSWORD}`);
    return res.data.accessToken;
  } catch (error) {
    console.error("Error in getting auth token!", error);
  }
};

const fetchDataBase = async () => {
  try {
    const token = await getAuthToken();
    const startDate = new Date().toISOString().split("T")[0];
    const res = await axios.get(`/api2/appointments/report?StartDateFrom=${startDate}&_limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error in fetching database!", error);
  }
};

const getRecordsList = async (data) => {
  const records = data.map((client) => {
    const clientData = {
      name: client.client.name,
      email: client.client.email,
      phone: client.client.phone,
      eventDate: client.startDate,
      createDate: client.createDate,
    };
    return clientData;
  });
  return records;
};

const filterByCreateDate = (arr, date) => {
  const filterDate = new Date(date);
  console.log("filter date", filterDate);
  return arr.filter((item) => new Date(item.createDate) > filterDate);
};

const checkAndSendEmails = async () => {
  try {
    // const data = await fetchDataBase();
    const data = await readData(fakeData);

    const recordList = await getRecordsList(data);
    const recToCheck = readData(savedRecords);

    if (recordList.length > 0) {
      if (!prevDate) {
        console.log("PrevDate is empty. Set new date");
        prevDate = new Date();
      }

      recToCheck.forEach((rec) => {
        if (new Date(rec.eventDate) < new Date()) {
          deleteByEmail(rec.email, savedRecords);
          console.log("Old event deleted", rec);
          return;
        }
        const index = recordList.findIndex((savedRec) => savedRec.email === rec.email);
        if (index === -1) {
          cancelEmailNotification(rec);
          deleteByEmail(rec.email, savedRecords);
          console.log("Cancel notification for", rec.email);
        }
      });

      const filteredRecordList = filterByCreateDate(recordList, prevDate);

      console.log("Found new records", filteredRecordList);

      filteredRecordList.forEach((newRec) => {
        console.log(`Send email to ${newRec.email}`);
        scheduleEmailNotification(newRec);
        addUser(newRec, savedRecords);
      });
    } else {
      console.log("No record was found");
    }
  } catch (error) {
    console.error("Error in checking and sending email", error.message);
  }
};

cron.schedule("*/1 * * * *", async () => {
  console.log("Check API data", new Date().toString());
  await checkAndSendEmails();
  prevDate = new Date();
});

// app.listen(PORT, () => {
//   console.log("Server is running!");
// });
