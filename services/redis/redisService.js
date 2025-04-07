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

const deleteSavedRec = async ({ email, eventDate }) => {
  try {
    const users = await getUsers();
    const filtered = users.filter((u) => u.email !== email || u.eventDate !== eventDate);
    await saveUsers(filtered);
  } catch (error) {
    console.error("Error deleting user by email and eventDate:", error.message);
  }
};

module.exports = {
  getUsers,
  saveUsers,
  addUser,
  deleteSavedRec,
};
