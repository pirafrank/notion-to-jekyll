const fs = require('fs');
const axios = require('axios');
const mime = require('mime-types');
const { getConfig } = require('./init');

const downloadBinaryStream = async (url, iteration, fileName) => {
  try {
    const config = getConfig();
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    const extension = mime.extension(response?.headers["content-type"]);

    const random = Math.floor(Math.random() * 100000);
    fileName = fileName || `image-${random}.${extension}`;

    const writeToPath = `${iteration.targetAssetPath}/${fileName}`;
    const publishedUrl = [
      config.siteUrl,
      config.siteBaseurl,
      config.assetsDir,
      iteration.targetAssetDir,
      fileName,
    ]
      .filter((x) => x !== "")
      .join("/");

    if(config.dryRun) {
      console.log(`** Dry-run mode ** : would have downloaded file to: ${writeToPath}`);
      return publishedUrl;
    }

    const writer = fs.createWriteStream(writeToPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        return resolve(
          // return the URL the asset will have once published
          `${publishedUrl}`
        )
      });
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    return "";
  }
}

module.exports = {
  downloadBinaryStream,
};
