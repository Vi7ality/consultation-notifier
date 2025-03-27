const fs = require("fs");

const readData = (filename) => {
  try {
    if (!fs.existsSync(filename)) return [];
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (error) {
    console.error("Failed to read JSON data", error.message);
  }
};

const saveData = (data, filename) => {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save JSON data", error.message);
  }
};

const addUser = (user, filename) => {
  try {
    let users = readData(filename);
    users.push(user);
    saveData(users, filename);
  } catch (error) {
    console.error("Failed to addUser", error.message);
  }
};

const deleteByEmail = (email, filename) => {
  try {
    let users = readData(filename);
    users = users.filter((user) => user.email !== email);
    saveData(users, filename);
  } catch (error) {
    console.error("Failed to delete userData!", error.message);
  }
};

module.exports = { readData, saveData, addUser, deleteByEmail };
