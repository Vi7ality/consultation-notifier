require("dotenv").config();
const express = require("express");
const axios = require("axios");
// const nodemailer = require("nodemailer");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

axios.defaults.baseURL = API_URL;

const getAuthToken = async () => {
  const res = await axios.get(`/api2/login/?username=${LOGIN}&password=${PASSWORD}`);
  return res.data.accessToken;
};

const fetchDataBase = async () => {
  const token = await getAuthToken();
  const startDate = new Date().toISOString().split("T")[0];
  const res = await axios.get(`/api2/appointments/report?StartDateFrom=${startDate}&_limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const getRecordsList = async (data) => {
  const records = data.map((client) => {
    const clientData = {
      name: client.client.name,
      email: client.client.email,
      phone: client.client.phone,
      visitTime: {
        start: client.startDate,
        end: client.endDate,
      },
      createDate: client.createDate,
    };
    return clientData;
  });
  return records;
};

const filterByCreateDate = (data, date) => {
  // const currentDate = new Date();
  const filterDate = new Date(date);
  return data.filter((item) => new Date(item.createDate) > filterDate);
};

const prevDate = "2025-03-19T15:58:50.673";

const checkAndSendEmails = async () => {
  const data = await fetchDataBase();
  const recordList = await getRecordsList(data);
  const filteredRecordList = filterByCreateDate(recordList, prevDate);
  console.log("Found records", filteredRecordList);
  filteredRecordList.forEach(({ email }) => {
    console.log(`Send email to ${email}`);
  });
};

cron.schedule("*/1 * * * *", async () => {
  console.log("Check API data", new Date());
  await checkAndSendEmails();
});

app.listen(PORT, () => {
  console.log("Server is running!");
});
