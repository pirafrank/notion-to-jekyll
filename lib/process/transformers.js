const { putAssetOffline, writeAccordionFile } = require("./fetch");
const { blocksToMarkdownString } = require("./blocks");

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
   {
     blockType: "toggle",
     transformer: async (block) => {
        // get toggle block title
        const title = block.toggle?.rich_text[0]?.plain_text;
        if (!title) throw new Error("Toggle block has no title");
        // get notion client and download toggle content (toggle block children)
        const notionClient = n2m.notionClient;
        const block_id = block.id;
        const response = await notionClient.blocks.children.list({
          block_id,
        });
        const children = response.results;
        // convert blocks to markdown
        const mdBlocks = await n2m.blocksToMarkdown(children);
        const mdContent = await blocksToMarkdownString(mdBlocks);
        // write mdContent to accordion file in _posts/accordions dir.
        const postDate = iteration.pageDate;
        const filename = writeAccordionFile(block_id, postDate, mdContent);
        // return the Jekyll accordion include to the created file.
        return `{% include accordion.html title="${title}" file="${filename}" %}`;
     },
   },
  ];
};

module.exports = {
  getTransformers,
};
