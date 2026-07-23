const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const { initConfig } = require("../lib/config/config");
const {
  initNotionClient,
  getBlogPostsToPublish,
} = require("../lib/clients/notion");
const toPublish = require("../lib/clients/queries/toPublish");

const REQUIRED_ENV = {
  NOTION_TOKEN: "secret-token",
  NOTION_DATA_SOURCE_ID: "data-source-123",
  RELATIVE_DATE: "0",
  JEKYLL_ROOT: path.join(__dirname, "fixtures", "jekyll-root"),
  SITE_URL: "https://example.com",
};

const setRequiredEnv = (overrides = {}) => {
  for (const [key, value] of Object.entries({ ...REQUIRED_ENV, ...overrides })) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const clearManagedEnv = () => {
  for (const key of Object.keys(REQUIRED_ENV)) {
    delete process.env[key];
  }
  delete process.env.PUBLISH_TO_POSTS;
};

describe("config", () => {
  beforeEach(() => {
    clearManagedEnv();
  });

  afterEach(() => {
    clearManagedEnv();
  });

  it("requires NOTION_DATA_SOURCE_ID", () => {
    setRequiredEnv();

    const config = initConfig({});

    assert.equal(config.dataSourceId, "data-source-123");
  });

  it("fails when NOTION_DATA_SOURCE_ID is missing", () => {
    setRequiredEnv({ NOTION_DATA_SOURCE_ID: undefined });

    assert.throws(
      () => initConfig({}),
      /Missing configuration for key: dataSourceId/
    );
  });
});

describe("getBlogPostsToPublish", () => {
  it("queries dataSources with data_source_id and the publish filter", async () => {
    const pages = [{ id: "page-1" }];
    let receivedArgs = null;

    initNotionClient("unused", {
      client: {
        dataSources: {
          query: async (args) => {
            receivedArgs = args;
            return { results: pages };
          },
        },
      },
    });

    const config = {
      dataSourceId: "data-source-123",
      notionPageType: "Blog post",
      notionReadyStatus: "Ready",
      startDate: "2026-07-23",
      endDate: "2026-07-23",
    };

    const results = await getBlogPostsToPublish(config);

    assert.deepEqual(results, pages);
    assert.deepEqual(receivedArgs, {
      data_source_id: "data-source-123",
      filter: toPublish(config),
    });
    assert.equal(Object.hasOwn(receivedArgs, "database_id"), false);
  });
});
