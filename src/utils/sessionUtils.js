const { v4: uuidv4 } = require("uuid");

const generateSessionId = () => {
  return uuidv4();
};

module.exports = {
  generateSessionId,
};
