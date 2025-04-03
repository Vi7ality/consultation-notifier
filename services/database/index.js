const axios = require("axios");
const API_URL = process.env.API_URL;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

let authToken = null;

axios.defaults.baseURL = API_URL;

const getAuthToken = async () => {
  if (authToken?.accessToken && authToken.expiresIn > Date.now()) {
    return authToken.accessToken;
  }

  try {
    const { data } = await axios.get(`/api2/login/?username=${LOGIN}&password=${PASSWORD}`);
    if (!data?.accessToken) throw new Error("No access token received");

    authToken = {
      accessToken: data.accessToken,
      expiresIn: Date.now() + data.expiresIn * 1000,
    };

    return authToken.accessToken;
  } catch (error) {
    console.error("Error getting auth token:", error.response?.data || error.message);
  }
};

const fetchDataBase = async () => {
  try {
    const token = await getAuthToken();
    const startDate = new Date().toISOString().split("T")[0];

    const { data } = await axios.get(
      `/api2/appointments/report?StartDateFrom=${startDate}&_limit=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return data;
  } catch (error) {
    console.error("Error fetching database:", error);
  }
};

module.exports = { getAuthToken, fetchDataBase };
