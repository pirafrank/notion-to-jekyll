const path = require('path');
const { getConfig } = require('../config/config');
const { writeObjectToJsonFile } = require('../utils/fs');
const { info, error, dry } = require('../utils/log');

let _cache = null;
let _cacheFilepath = null;

const loadCache = () => {
  try {
    const config = getConfig();
    _cacheFilepath = path.join(config.jekyllRoot, config.notionToJekyllCache);
    _cache = require(_cacheFilepath);
    info(`Loaded cache from ${_cacheFilepath}, version ${_cache.version}`);
  } catch (err) {
    error(`Error loading cache from ${_cacheFilepath}.`, err);
  }
};

const getCacheObject = () => {
  if (!_cache) loadCache();
  return _cache;
}

const getCache = () => {
  return getCacheObject().data;
};

const persistCache = (cacheData) => {
  const config = getConfig();
  if(config.dryRun) {
    dry("won't persist cache in dry run mode.");
    return;
  }
  // update cache metadata
  let cache = getCacheObject();
  cache.sequence = cache.sequence + 1;
  cache.lastUpdate = new Date().toISOString();
  cache.data = cacheData;
  // getting cache path. This is a global variable, already initialized
  // by getCacheObject() method above.
  const cacheFilepath = _cacheFilepath;
  // then write cache object to disk
  writeObjectToJsonFile(cacheFilepath, cache);
  info(`Cache saved to ${cacheFilepath}`);
};

module.exports = {
  getCache,
  persistCache,
};
