const formatDate = (dateStr) => dateStr.replace(/(\d{4}-\d{2}-)(\d)(T.*)/, "$10$2$3");

module.exports = formatDate;
