const axios = require("axios");
const { DateTime } = require("luxon");

const API_URL = process.env.API_URL;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

let authToken = null;

axios.defaults.baseURL = API_URL;

const refreshAuthToken = async () => {
  try {
    const { data } = await axios.get(`/api2/login/?username=${LOGIN}&password=${PASSWORD}`);

    if (!data?.accessToken || !data?.expiresIn) {
      throw new Error("No access token or expiration received");
    }

    authToken = {
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
    };

    console.log("✅ Access token refreshed");
    return authToken.accessToken;
  } catch (error) {
    console.error("❌ Error getting auth token:", error.response?.data || error.message);
    throw error;
  }
};

const getAuthToken = async () => {
  if (
    authToken?.accessToken &&
    DateTime.fromSeconds(authToken.expiresIn).minus({ minutes: 10 }) > DateTime.utc()
  ) {
    return authToken.accessToken;
  }
  return await refreshAuthToken();
};

const fetchDataBase = async (retry = true) => {
  try {
    const token = await getAuthToken();
    const startDate = new Date().toISOString().split("T")[0];

    const { data } = await axios.get(
      `/api2/appointments/report?StartDateFrom=${startDate}&_limit=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("📦 Data fetched:", data.length);
    return data;
  } catch (error) {
    const status = error.response?.status;

    if (status === 401 && retry) {
      console.warn("🔁 Token expired. Refreshing and retrying fetch...");
      await refreshAuthToken();
      return await fetchDataBase(false);
    }

    console.error("❌ Error fetching database:", error.message || error);
    throw error;
  }
};

module.exports = { getAuthToken, fetchDataBase };
