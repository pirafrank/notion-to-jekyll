const path = require('path');
const { getConfig } = require('../config/config');
const { writeObjectToJsonFile } = require('../utils/fs');
const { info, error } = require('../utils/log');

let _cache = null;

const loadCache = () => {
  try {
    const config = getConfig();
    const cachePath = path.join(config.jekyllRoot, '.notion-to-jekyll.json');
    _cache = require(cachePath);
    info(
      `Loaded cache from ${cachePath}, version ${_cache.version}`
    );
  } catch (err) {
    error(`Error loading cache from ${cachePath}.`, err);
  }
};

const getCacheObject = () => {
  if (!_cache) loadCache();
  return _cache;
}

const getCache = () => {
  return getCacheObject().data;
};

const persistCache = (cachePath, cacheData) => {
  let cache = getCacheObject();
  cache.sequence = cache.sequence + 1;
  cache.lastUpdate = new Date().toISOString();
  cache.data = cacheData;
  writeObjectToJsonFile(cachePath, cache);
  info(`Cache saved to ${cachePath}`);
};

module.exports = {
  getCache,
  persistCache,
};
