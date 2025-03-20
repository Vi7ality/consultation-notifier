require("dotenv").config();
const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

app.listen(PORT, () => {
  console.log("Server is running!");
});
