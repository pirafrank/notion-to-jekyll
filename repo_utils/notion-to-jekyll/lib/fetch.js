const fs = require('fs');
const axios = require('axios');
const { getConfig } = require('./init');

const extractExtensionFromUrl = (url) => {
  return url.split("?")[0]?.split(".")?.pop();
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
  extractExtensionFromUrl,
  downloadBinaryStream,
};
