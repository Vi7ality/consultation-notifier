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
  console.log("auth data", res.data);
  return res.data.accessToken;
};

const fetchDataBase = async () => {
  const token = await getAuthToken();
  const startDate = new Date().toISOString().split("T")[0];
  const res = await axios.get(`/api2/appointments/report?StartDateFrom=${startDate}&_limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(res.data);
};

app.listen(PORT, () => {
  fetchDataBase();
  console.log("Server is running!");
});
