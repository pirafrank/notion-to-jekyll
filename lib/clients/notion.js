const { Client } = require("@notionhq/client");
const { error } = require("../utils/log");
const toPublish = require("./queries/toPublish");


let _notionClient = null;

// Initializing client
const initNotionClient = (notionToken, options = {}) => {
  _notionClient =
    options.client ||
    new Client({
      auth: notionToken,
      notionVersion: "2025-09-03",
    });
}

const getNotionClient = () => {
  if (!_notionClient) throw new Error("Notion client not initialized.");
  return _notionClient;
}

const getBlogPostsToPublish = async (config) => {
  const notionClient = getNotionClient();
  const dataSourceId = config.dataSourceId;

  const queryResults = await notionClient.dataSources.query({
    data_source_id: dataSourceId,
    filter: toPublish(config),
  });
  // check if target object exists, quit otherwise
  if (
    !queryResults ||
    !queryResults.results ||
    !Array.isArray(queryResults.results)
  ) {
    error(
      `No array to parse in query results: ${JSON.stringify(queryResults)}`
    );
    error("Quitting...`");
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
  getBlogPostsToPublish,
  updatePageProperties,
  updatePublishedByProperty,
  updatePublishedByAndStatusProperties,
};
