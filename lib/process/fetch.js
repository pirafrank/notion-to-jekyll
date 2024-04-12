const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { uuidToBase58 } = require('../utils/text');
const { info, error, dry } = require('../utils/log');
const { getConfig } = require('../config/config');
const {
  createDirectory, filenamemify,
  deleteFileIfExistsSync, writeFileSync
} = require("../utils/fs");
const { getCache, persistCache } = require('../data/cache');
const { ipc } = require('../data/ipc');


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
  const cache = getCache();
  // avoid overwriting assets which may have the same original filenames
  const random = Math.floor(Math.random() * 100000);
  const filename = `${random}-${extractFilenameFromUrl(url)}`;
  let publishedUrl = "#";
  const cacheEntry = cache?.[assetId];
  // note:
  // anything with 'dir' is a releative dir path
  // anything with 'path' is an absolute dir path
  if (!cacheEntry) {
    publishedUrl = calculatePublishedUrl(
      iteration.targetAssetDir,
      filename
    );

    // first download...
    const writtenFile = await downloadBinaryStreamToFile(url, iteration, filename);
    ipc.push(ipc.data.changed, writtenFile);
    info(`Downloaded asset to: ${writtenFile}`)
    // ... then write to cache
    cache[assetId] = publishedUrl;
    persistCache(cache);
  } else {
    info(`File already downloaded: ${cacheEntry}. Skipping download.`);
    publishedUrl = cache[assetId];
  }
  return {
    filename: filename,
    publishedUrl: publishedUrl,
  };
};

const downloadBinaryStreamToFile = async (url, iteration, filename) => {
  try {
    const config = getConfig();
    const targetAssetPath = iteration.targetAssetPath;
    const writeToPath = path.join(targetAssetPath, filename);
    iteration.createFolder && createDirectory(targetAssetPath);

    if (config.dryRun) {
      dry(`would have downloaded file to: ${writeToPath}`);
      return writeToPath;
    }

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    const writer = fs.createWriteStream(writeToPath);
    response.data.pipe(writer);

    // only create the asset folder once per iteration (aka per Notion page)
    iteration.createFolder = false;

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(writeToPath));
      writer.on("error", reject);
    });
  } catch (err) {
    error(`Error downloading asset to write to: ${writeToPath}`, err);
    throw err;
  }
};

const writeAccordionFile = (block_id, postDate, content) => {
  // get target filepath for the accordion file
  const config = getConfig();
  const outputPath = path.join(config.postsAccordionPath, postDate);
  const filename = `${uuidToBase58(block_id)}.md`;
  const filepath = path.join(outputPath, filename);
  // first delete any previous version of the file, if it has been written
  // before and still exists, as toggle content may have been updated.
  const cache = getCache();
  if(!!cache[block_id]) {
    deleteFileIfExistsSync(path.join(config.jekyllRoot,cache[block_id]));
  }
  // then create target dir and write to file
  createDirectory(outputPath);
  writeFileSync(filepath, content);
  info(`Accordion file written to: ${filepath}`);
  // calculate accordion file path relative to the Jekyll root, this to make
  // it consistent with the various environments the website sources may be
  // cloned to. Then write filepath to cache using the parent block id (the
  // block id of the toggle) as key.
  const relativeAccordionFilepath = filepath
    .replace(config.jekyllRoot, '')
    .replace(/^\//, '');
  cache[block_id] = relativeAccordionFilepath;
  persistCache(cache);
  // return filename
  return filename;
}

module.exports = {
  putAssetOffline,
  writeAccordionFile,
};
