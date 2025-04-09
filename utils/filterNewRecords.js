const filterNewRecords = (records, savedRecordsList) =>
  records.filter((rec) => {
    return !savedRecordsList.some(
      (savedRec) => savedRec.email === rec.email && savedRec.eventDate === rec.eventDate
    );
  });
module.exports = filterNewRecords;
