const { getConfig } = require("./init");
const { writeObjectToJsonFile } = require("./fs");
const { extractExtensionFromUrl, downloadBinaryStream } = require("./fetch");

const persistCache = (config, cache) => {
  const cachePath = `${config.repoRoot}/.notion-to-jekyll.json`;
  cache.sequence = cache.sequence + 1;
  cache.lastUpdate = new Date().toISOString();
  writeObjectToJsonFile(cachePath, cache);
  console.log(`Cache saved to ${cachePath}`);
};

const calculatePublishedUrl = (config, targetAssetDir, fileName) => {
  const publishedUrl = [
    config.siteUrl,
    config.siteBaseurl,
    config.assetsDir,
    targetAssetDir,
    fileName,
  ]
    .filter((x) => x !== "")
    .join("/");
  return publishedUrl;
};

const putAssetOffline = async (url, fileName, iteration, block, cache) => {
  const config = getConfig();
  let publishedUrl = '#';
  const cacheEntry = cache?.data?.[block.id];
  // note:
  // anything with 'dir' is a releative dir path
  // anything with 'path' is an absolute dir path
  //
  // block.id is the unique id of the block,
  // this to understand if the asset has been downloaded already,
  // as no block change means no asset change in Notion.
  //
  // IMPORTANT: this is a very naive approach, as it assumes that
  // the asset is not 'replaced' in Notion, but you delete the block and
  // upload another file to a new '/file' block.
  if (!cacheEntry) {
    publishedUrl = calculatePublishedUrl(
      config,
      iteration.targetAssetDir,
      fileName
    );
    // first download...
    const writeToPath = `${iteration.targetAssetPath}/${fileName}`;
    await downloadBinaryStream(url, writeToPath);
    // ... then write to cache
    cache.data[block.id] = publishedUrl;
    persistCache(config, cache);
  } else {
    console.log(
      `File already downloaded: ${cacheEntry}. Skipping download.`
    );
    publishedUrl = cache.data[block.id];
  }
  return publishedUrl;
}

const getTransformers = (n2m, iteration, cache) => {
  return [
    {
      blockType: "embed",
      transformer: async (block) => {
        //console.log(`embed block: ${JSON.stringify(block)}`);
        const { embed } = block;
        if (!embed?.url) return "";
        return `<figure>
        <iframe src="${embed?.url}"></iframe>
        <figcaption>${await n2m.blockToMarkdown(embed?.caption)}</figcaption>
      </figure>`;
      },
    },
    {
      // tested with image.type = "file" and "external"
      blockType: "image",
      transformer: async (block) => {
        //console.log(`image block: ${JSON.stringify(block)}`);
        const { image } = block;
        if (!image?.type) return "";
        const url = image[image.type]?.url;

        const random = Math.floor(Math.random() * 100000);
        const extension = extractExtensionFromUrl(url);
        const fileName = `image-${random}.${extension}`;

        let publishedUrl = await putAssetOffline(
          url,
          fileName,
          iteration,
          block,
          cache
        );
        const caption = image?.caption || "default caption";
        return `![${caption}](${publishedUrl})`;
      },
    },
    {
      blockType: "file",
      transformer: async (block) => {
        //console.log(`file block: ${JSON.stringify(block)}`);
        const { file } = block;
        if (!file?.type || !file?.name) return "";
        const url = file[file.type]?.url;
        const fileName = file.name;

        let publishedUrl = await putAssetOffline(
          url,
          fileName,
          iteration,
          block,
          cache
        );
        return `[${fileName}](${publishedUrl})`;
      },
    },
  ];
};

module.exports = {
  getTransformers,
};
