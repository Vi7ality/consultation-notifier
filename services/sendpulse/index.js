import axios from "axios";
require("dotenv").config();

const NOTIFICATION_API_ID = process.env.NOTIFICATION_API_ID;
const CANCELATION_API_ID = process.env.CANCELATION_API_ID;

export const scheduleEmailNotification = async ({ name, email, phone, eventDate }) => {
  try {
    await axios.post(`https://events.sendpulse.com/events/id/${NOTIFICATION_API_ID}`, {
      email: email,
      phone: phone,
      event_date: eventDate,
      client_name: name,
    });
  } catch (error) {
    console.error("Failing to schedule event notification!", error);
  }
};

export const cancelEmailNotification = async ({ email, phone, eventDate }, reason = "other") => {
  try {
    await axios.post(`https://events.sendpulse.com/events/id/${CANCELATION_API_ID}`, {
      email: email,
      phone: phone,
      event_date: eventDate,
      cancelationReason: reason,
    });
  } catch (error) {
    console.error("Failing to cancel event notification!", error);
  }
};
