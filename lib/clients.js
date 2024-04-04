const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { getTransformers } = require("./transformers");


let _notionClient = null;
let _notionToMarkdownConverter = null;

// Initializing a client
const initNotionClient = (notionToken) => {
  _notionClient = new Client({
    auth: notionToken,
  });
}

const getNotionClient = () => {
  if (!_notionClient) throw new Error("Notion client not initialized.");
  return _notionClient;
}

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
}

const configNotionToMarkdownTransformers = (iteration) => {
  const n2m = getNotionToMarkdownConverter();
  const tfx = getTransformers(n2m, iteration);
  for (i = 0; i < tfx.length; i++) {
    _notionToMarkdownConverter.setCustomTransformer(
      tfx[i].blockType,
      tfx[i].transformer
    );
  }
}

const getBlogPostsToPublish = async (config) => {
  const notionClient = getNotionClient();
  const databaseId = config.databaseId;
  const date = config.date;

  const queryResults = await notionClient.databases.query({
    database_id: databaseId,
    filter: {
      // NB. properties are case sensitive!
      and: [
        {
          property: "Type",
          select: {
            equals: config.notionPageType,
          },
        },
        {
          property: "Status",
          status: {
            equals: config.notionReadyStatus,
          },
        },
        {
          property: "Publish Date",
          date: {
            equals: date,
          },
        },
      ],
    },
  });
  // check if target object exists, quit otherwise
  if (
    !queryResults ||
    !queryResults.results ||
    !Array.isArray(queryResults.results)
  ) {
    console.error(
      `No array to parse in query results: ${JSON.stringify(queryResults)}`
    );
    console.error("Quitting...`");
    process.exit(2);
  }
  return queryResults.results;
};

const updatePageProperties = async (pageId, properties) => {
  if (!pageId) throw new Error("No page ID provided to update properties.");
  if (!properties) throw new Error("No properties provided to update page.");
  const notionClient = getNotionClient();
  const response = await notionClient.pages.update({
    page_id: pageId,
    properties: properties,
  });
  return response;
};

const updatePublishedByProperty = async (pageId, publishedBy) => {
  return updatePageProperties(pageId, {
    "Published By": {
      select: {
        name: publishedBy,
      },
    },
  });
};

const updatePublishedByAndStatusProperties = async (pageId, publishedBy, status) => {
  return updatePageProperties(pageId, {
    "Published By": {
      select: {
        name: publishedBy,
      },
    },
    Status: {
      status: {
        name: status,
      },
    },
  });
};

module.exports = {
  initNotionClient,
  getNotionClient,
  initNotionToMarkdownConverter,
  getNotionToMarkdownConverter,
  configNotionToMarkdownTransformers,
  getBlogPostsToPublish,
  updatePageProperties,
  updatePublishedByProperty,
  updatePublishedByAndStatusProperties,
};
