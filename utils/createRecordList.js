const formatDate = require("./formatDate");

const createRecordList = (data) =>
  data.reduce((acc, { client, startDate, createDate, resultProcedures, courses }) => {
    if (client && startDate) {
      acc.push({
        name: client.name || client.firstName || "",
        firstName: client.firstName || "",
        middleName: client.middleName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: `+38${client.phone}` || "",
        birthDate: client.birthDate || "",
        eventDate: formatDate(startDate),
        createDate: formatDate(createDate),
        cause: resultProcedures[0]?.procedureName || courses[0]?.title || "",
      });
    }
    return acc;
  }, []);

module.exports = createRecordList;
