const redis = require("../config/redis");

const BLACKLIST_PREFIX = "blacklist_token:";

const addToBlacklist = async (token, duration) => {
  await redis.set(BLACKLIST_PREFIX + token, "blacklisted", "EX", duration);
};

const isBlacklisted = async (token) => {
  const result = await redis.get(BLACKLIST_PREFIX + token);
  return result !== null;
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
};
