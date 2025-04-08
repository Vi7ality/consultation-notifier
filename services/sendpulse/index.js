require("dotenv").config();
const axios = require("axios");

const NOTIFICATION_API_ID = process.env.NOTIFICATION_API_ID;
const CANCELATION_API_ID = process.env.CANCELATION_API_ID;
const SENDPULSE_CLIENT_ID = process.env.SENDPULSE_CLIENT_ID;
const SENDPULSE_CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET;
const SENDPULSE_CONTACTLIST_ID = process.env.SENDPULSE_CONTACTLIST_ID;

const scheduleEmailNotification = async ({ name, email, phone, eventDate, cause }) => {
  try {
    const [date, time] = eventDate.split("T");
    const formattedTime = time.split(":").slice(0, 2).join(":");

    const response = await axios.post(
      `https://events.sendpulse.com/events/id/${NOTIFICATION_API_ID}`,
      {
        email: email,
        phone: phone,
        event_date: date,
        event_time: formattedTime,
        client_name: name,
        cause: cause,
      }
    );
    console.log(`Sent email notification to ${email}, result: ${response.data.result}`);
  } catch (error) {
    console.error("Failing to schedule event notification!", error.message);
  }
};

const cancelEmailNotification = async ({ name, email, phone, eventDate }, reason = "other") => {
  try {
    const [date, time] = eventDate.split("T");
    const formattedTime = time.split(":").slice(0, 2).join(":");

    const response = await axios.post(
      `https://events.sendpulse.com/events/id/${CANCELATION_API_ID}`,
      {
        email: email,
        phone: phone,
        event_date: date,
        event_time: formattedTime,
        cancelationReason: reason,
        client_name: name,
      }
    );
    console.log(`Sent cancel email notification to ${email}, result: ${response.data.result}`);
  } catch (error) {
    console.error("Failing to cancel event notification!", error.message);
  }
};

const getAPIToken = async () => {
  try {
    const res = await axios.post("https://api.sendpulse.com/oauth/access_token", {
      grant_type: "client_credentials",
      client_id: SENDPULSE_CLIENT_ID,
      client_secret: SENDPULSE_CLIENT_SECRET,
    });
    return res.data.access_token;
  } catch (error) {
    console.error("Error catching SendPulse API token:", error.message);
  }
};

const createSPContact = async ({ email, phone, firstName, middleName, lastName, birthDate }) => {
  try {
    const accessToken = await getAPIToken();
    const [date, _] = birthDate.split("T");
    const res = await axios.post(
      `https://api.sendpulse.com/addressbooks/${SENDPULSE_CONTACTLIST_ID}/emails`,
      {
        emails: [
          {
            email: email,
            variables: {
              "ім'я": firstName,
              Прізвище: lastName,
              "По-батькові": middleName,
              "День Народження": date,
              phone: phone,
            },
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      }
    );
    console.log("SP contact created", res.data.result);
  } catch (error) {
    console.error("Error with creating SendPulse contact:", error.message);
  }
};

module.exports = { scheduleEmailNotification, cancelEmailNotification, createSPContact };
