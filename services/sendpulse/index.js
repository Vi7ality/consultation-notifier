const axios = require("axios");
require("dotenv").config();

const NOTIFICATION_API_ID = process.env.NOTIFICATION_API_ID;
const CANCELATION_API_ID = process.env.CANCELATION_API_ID;

const scheduleEmailNotification = async ({ name, email, phone, eventDate }) => {
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

module.exports = { scheduleEmailNotification, cancelEmailNotification };
