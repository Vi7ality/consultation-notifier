const { getUsers, saveUsers, addUser, deleteByEmail } = require("./redisService");

module.exports = {
  getUsers,
  saveUsers,
  addUser,
  deleteByEmail,
};
