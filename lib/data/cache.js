const path = require('path');
const { getConfig } = require('../config/config');
const { writeObjectToJsonFile } = require('../utils/fs');
const { info } = require('../utils/log');

let _cache = null;

const loadCache = () => {
  try {
    const config = getConfig();
    const cachePath = path.join(config.jekyllRoot, '.notion-to-jekyll.json');
    _cache = require(cachePath);
    console.log(
      `Loaded cache from ${cachePath}, version ${_cache.version}`
    );
  } catch (error) {
    console.error(`Error loading cache from ${cachePath}.`, error);
  }
};

const getCache = () => {
  if (!_cache) loadCache();
  return _cache;
};

const persistCache = (cachePath, cache) => {
  cache.sequence = cache.sequence + 1;
  cache.lastUpdate = new Date().toISOString();
  writeObjectToJsonFile(cachePath, cache);
  info(`Cache saved to ${cachePath}`);
};

module.exports = {
  getCache,
  persistCache,
};