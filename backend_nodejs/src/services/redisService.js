const redisClient = require("../config/redis");

async function setRedisJson(key, ttlSeconds, value) {
  if (!redisClient || !redisClient.isOpen) return;
  await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
}

async function delRedisKey(key) {
  if (!redisClient || !redisClient.isOpen) return;
  await redisClient.del(key);
}

module.exports = {
  setRedisJson,
  delRedisKey,
};
