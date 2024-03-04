const { downloadBinaryStream } = require("./fetch");

const getTransformers = (n2m, iteration) => {
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
        const publishedUrl = await downloadBinaryStream(
          url,
          iteration,
          null
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
        const publishedUrl = await downloadBinaryStream(
          url,
          iteration,
          file.name
        );
        return `[${file.name}](${publishedUrl})`;
      },
    },
  ];
};

module.exports = {
  getTransformers,
}
