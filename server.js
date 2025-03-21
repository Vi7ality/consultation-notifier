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
  const res = await axios.get(`/api2/appointments/report?StartDateFrom=${startDate}&_limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const getVisitorList = async () => {
  const data = await fetchDataBase();
  const visitors = data.map((client) => {
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
  console.log("visitors", visitors);
  return visitors;
};

app.listen(PORT, () => {
  console.log("Server is running!");
  getVisitorList();
});
