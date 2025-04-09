const formatDate = require("./formatDate");

const createRecordList = (data) =>
  data.map(({ client, startDate, createDate, resultProcedures, courses }) => ({
    name: client.name,
    firstName: client.firstName,
    middleName: client.middleName,
    lastName: client.lastName,
    email: client.email,
    phone: `+38${client.phone}`,
    birthDate: client.birthDate,
    eventDate: formatDate(startDate),
    createDate: formatDate(createDate),
    cause: resultProcedures[0]?.procedureName || courses[0]?.title || "",
  }));

module.exports = createRecordList;
