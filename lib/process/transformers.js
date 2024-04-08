const { putAssetOffline } = require("./fetch");

// notes:
//
// block.id is the unique id of the block,
// this to understand if the asset has been downloaded already,
// as no block change means no asset change in Notion.
//
// IMPORTANT: this is a very naive approach, as it assumes that
// the asset is not 'replaced' in Notion, but you delete the block and
// upload another file to a new '/file' block.
//
const getTransformers = (n2m, iteration) => {
  return [
    {
      blockType: "embed",
      transformer: async (block) => {
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
        const { image } = block;
        if (!image?.type) return "";
        const url = image[image.type]?.url;
        const { publishedUrl } = await putAssetOffline(
          url,
          iteration,
          block.id
        );
        const caption = image?.caption || "default caption";
        return `![${caption}](${publishedUrl})`;
      },
    },
    {
      blockType: "file",
      transformer: async (block) => {
        const { file } = block;
        if (!file?.type || !file?.name) return "";
        const url = file[file.type]?.url;
        const { filename, publishedUrl } = await putAssetOffline(
          url,
          iteration,
          block.id
        );
        return `[${filename}](${publishedUrl})`;
      },
    },
  ];
};

module.exports = {
  getTransformers,
};
