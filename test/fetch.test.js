const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const { initConfig } = require("../lib/config/config");
const { calculateJekyllAssetUrl, calculateJekyllAssetPath } = require("../lib/process/fetch");

const REQUIRED_ENV = {
  NOTION_TOKEN: "secret-token",
  NOTION_DATA_SOURCE_ID: "data-source-123",
  RELATIVE_DATE: "0",
  JEKYLL_ROOT: path.join(__dirname, "fixtures", "jekyll-root"),
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
  delete process.env.ASSETS_DIR;
};

describe("calculateJekyllAssetUrl", () => {
  beforeEach(() => {
    clearManagedEnv();
    setRequiredEnv();
    initConfig({});
  });

  afterEach(() => {
    clearManagedEnv();
  });

  it("builds asset URLs with Jekyll site.baseurl liquid syntax", () => {
    assert.equal(
      calculateJekyllAssetUrl("1001", "28258-image.png"),
      "{{ site.baseurl }}/assets/1001/28258-image.png"
    );
  });

  it("uses ASSETS_DIR in the generated URL", () => {
    process.env.ASSETS_DIR = "static/postimages";
    initConfig({});

    assert.equal(
      calculateJekyllAssetUrl("1001", "28258-image.png"),
      "{{ site.baseurl }}/static/postimages/1001/28258-image.png"
    );
  });
});

describe("calculateJekyllAssetPath", () => {
  beforeEach(() => {
    clearManagedEnv();
    setRequiredEnv();
    initConfig({});
  });

  afterEach(() => {
    clearManagedEnv();
  });

  it("builds site-relative asset paths for seoimage frontmatter", () => {
    process.env.ASSETS_DIR = "static/postimages";
    initConfig({});

    assert.equal(
      calculateJekyllAssetPath("3019", "71179-image.png"),
      "/static/postimages/3019/71179-image.png"
    );
  });
});
