const { NotionToMarkdown } = require("notion-to-md");
const { getNotionClient } = require("./notion");

let _notionToMarkdownConverter = null;

// Configuring NotionToMarkdown
const initNotionToMarkdownConverter = () => {
  _notionToMarkdownConverter = new NotionToMarkdown({
    notionClient: getNotionClient(),
    config: {
      // by default parseChildPages is set to false
      // to avoid parsing child pages
      parseChildPages: false,
    },
  });
};

const getNotionToMarkdownConverter = () => {
  if (!_notionToMarkdownConverter)
    throw new Error("notion-to-markdown converter not initialized.");
  return _notionToMarkdownConverter;
};

module.exports = {
  initNotionToMarkdownConverter,
  getNotionToMarkdownConverter,
};
