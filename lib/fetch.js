const fs = require('fs');
const axios = require('axios');
const { getConfig } = require('./init');
const { createDirectory, persistCache, filenamemify } = require("./fs");

let cache = null;

const loadCache = (cachePath) => {
  try {
    const config = getConfig();
    cache = require(config.repoRoot + "/.notion-to-jekyll.json");
    console.log(
      `Loaded cache from ${config.repoRoot}/.notion-to-jekyll.json, version ${cache.version}`
    );
  } catch (error) {
    console.error(`Error loading cache from ${cachePath}.`, error);
  }
};

const getCache = () => {
  if (!cache) loadCache();
  return cache;
};

const extractFilenameFromUrl = (url) => {
  const base = url.split("/").pop().split("?")[0];
  const splitted = base.split(".");
  const encodedFilename = splitted.slice(0, -1).join(".");
  const extension = splitted.pop();
  return `${filenamemify(decodeURI(encodedFilename))}.${extension}`;
};

const calculatePublishedUrl = (targetAssetDir, filename) => {
  const config = getConfig();
  const publishedUrl = [
    config.siteUrl,
    config.siteBaseurl,
    config.assetsDir,
    targetAssetDir,
    filename,
  ]
    .filter((x) => x !== "")
    .join("/");
  return publishedUrl;
};

const putAssetOffline = async (url, iteration, assetId) => {
  const config = getConfig();
  const cache = getCache();
  // avoid overwriting assets which may have the same original filenames
  const random = Math.floor(Math.random() * 100000);
  const filename = `${random}-${extractFilenameFromUrl(url)}`;
  let publishedUrl = "#";
  const cacheEntry = cache?.data?.[assetId];
  // note:
  // anything with 'dir' is a releative dir path
  // anything with 'path' is an absolute dir path
  if (!cacheEntry) {
    publishedUrl = calculatePublishedUrl(
      iteration.targetAssetDir,
      filename
    );

    // create the target asset directory for current Notion page
    // if it doesn't exist
    (config.dryRun &&
      console.log(
        `** Dry-run mode ** : would have created directory: ${iteration.targetAssetPath}`
      )) ||
      (iteration.createFolder && createDirectory(iteration.targetAssetPath));
    // only create the asset folder once per iteration (aka per Notion page)
    iteration.createFolder = false;

    // first download...
    const writeToPath = `${iteration.targetAssetPath}/${filename}`;
    await downloadBinaryStream(url, writeToPath);
    // ... then write to cache
    cache.data[assetId] = publishedUrl;
    const cachePath = `${config.repoRoot}/.notion-to-jekyll.json`;
    persistCache(cachePath, cache);
  } else {
    console.log(`File already downloaded: ${cacheEntry}. Skipping download.`);
    publishedUrl = cache.data[assetId];
  }
  return {
    filename: filename,
    publishedUrl: publishedUrl,
  };
};

const downloadBinaryStream = async (url, writeToPath) => {
  try {
    const config = getConfig();
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    if (config.dryRun) {
      console.log(
        `** Dry-run mode ** : would have downloaded file to: ${writeToPath}`
      );
      return;
    }

    const writer = fs.createWriteStream(writeToPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading asset to write to: ${writeToPath}`, error);
    throw error;
  }
};

module.exports = {
  putAssetOffline,
};
