const { writeObjectToJsonFile } = require('../utils/fs');
const { info } = require('../utils/log');


let _cache = null;

const loadCache = (cachePath) => {
  try {
    const config = getConfig();
    _cache = require(config.jekyllRoot + "/.notion-to-jekyll.json");
    console.log(
      `Loaded cache from ${config.jekyllRoot}/.notion-to-jekyll.json, version ${_cache.version}`
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
