const redis = require("./connect");

const getUsers = async () => {
  try {
    const data = await redis.get("savedUsers");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error fetching saved users", error.message);
  }
};

const saveUsers = async (users) => {
  try {
    await redis.set("savedUsers", JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users", error.message);
  }
};

const addUser = async (user) => {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
};

const deleteByEmail = async (email) => {
  try {
    const users = await getUsers();
    const filtered = users.filter((u) => u.email !== email);
    await saveUsers(filtered);
  } catch (error) {
    console.error("Error deleting users", error.message);
  }
};

module.exports = {
  getUsers,
  saveUsers,
  addUser,
  deleteByEmail,
};
