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

    // first download...
    await downloadBinaryStream(url, iteration, filename);
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

const downloadBinaryStream = async (url, iteration, filename) => {
  try {
    const config = getConfig();
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const targetAssetPath = iteration.targetAssetPath;
    const writeToPath = `${targetAssetPath}/${filename}`;

    if (config.dryRun) {
      iteration.createFolder &&
        console.log(
          `** Dry-run mode ** : would have created directory: ${iteration.targetAssetPath}`
        );
      console.log(
        `** Dry-run mode ** : would have downloaded file to: ${writeToPath}`
      );
      return;
    }

    iteration.createFolder && createDirectory(targetAssetPath);
    const writer = fs.createWriteStream(writeToPath);
    response.data.pipe(writer);

    // only create the asset folder once per iteration (aka per Notion page)
    iteration.createFolder = false;

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
