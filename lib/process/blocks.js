const { getNotionToMarkdownConverter } = require("../clients/converter");

const processMdConversion = (mdContent) => {
  // remove any double empty lines, which are again markdown format
  mdContent = mdContent.replace(/\n\n\n/g, "\n\n");
  return mdContent;
};

const blocksToMarkdownString = async (mdBlocks) => {
  const n2m = getNotionToMarkdownConverter();
  const mdString = await n2m.toMarkdownString(mdBlocks);
  let mdContent = mdString?.parent;
  return processMdConversion(mdContent);
};

module.exports = {
  blocksToMarkdownString,
};
