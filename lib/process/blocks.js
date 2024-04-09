const { getNotionToMarkdownConverter } = require("../clients/converter");

const processMdConversion = (mdContent) => {
  // safe fallback
  if(!mdContent) return "";
  // remove any double empty lines, which are again markdown format
  mdContent = mdContent.replace(/\n\n\n/g, "\n\n");
  return mdContent;
};

const blocksToMarkdownString = async (mdBlocks) => {
  if(!mdBlocks || !Array.isArray(mdBlocks) || mdBlocks.length === 0)
    throw new Error("No blocks to convert to markdown");
  const n2m = getNotionToMarkdownConverter();
  const mdString = await n2m.toMarkdownString(mdBlocks);
  let mdContent = mdString?.parent;
  return processMdConversion(mdContent);
};

module.exports = {
  blocksToMarkdownString,
};
