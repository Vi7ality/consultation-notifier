require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

axios.defaults.baseURL = API_URL;

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
  return arr.filter((item) => new Date(item.createDate) > filterDate);
};

let prevDate;

const checkAndSendEmails = async () => {
  try {
    const data = await fetchDataBase();
    const recordList = await getRecordsList(data);
    if (recordList.length > 0) {
      if (!prevDate) {
        prevDate = new Date();
      }
      const filteredRecordList = filterByCreateDate(recordList, prevDate);
      console.log("Found new records", filteredRecordList);
      filteredRecordList.forEach(({ email }) => {
        console.log(`Send email to ${email}`);
      });
    } else {
      console.log("No record was found");
    }
  } catch (error) {
    console.error("Error in chacking and sending email", error.message);
  }
};

cron.schedule("*/1 * * * *", async () => {
  console.log("Check API data", new Date());
  await checkAndSendEmails();
  prevDate = new Date();
});

app.listen(PORT, () => {
  console.log("Server is running!");
});
