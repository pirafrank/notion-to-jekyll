const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  convertPropertiesToJekyllFrontmatter,
} = require("../lib/process/frontmatter");

const baseProperties = () => ({
  Name: {
    title: [{ plain_text: "Hello World" }],
  },
  Subtitle: {
    rich_text: [{ plain_text: "A subtitle" }],
  },
  Description: {
    rich_text: [{ plain_text: "A longer description" }],
  },
  Category: {
    select: { name: "Posts" },
  },
  Tags: {
    multi_select: [{ name: "Linux" }, { name: "Bash" }],
  },
});

const buildPage = (propertyOverrides = {}) => ({
  id: "page-123",
  properties: {
    ...baseProperties(),
    ...propertyOverrides,
  },
});

const metadata = {
  pageName: "Hello World",
  targetAssetDir: "1",
};

describe("convertPropertiesToJekyllFrontmatter", () => {
  it("adds lowercase series and part when both Notion properties are present", async () => {
    const page = buildPage({
      Series: {
        rich_text: [{ plain_text: "Deep Dive" }],
      },
      Part: {
        number: 2,
      },
    });

    const frontmatter = await convertPropertiesToJekyllFrontmatter(
      metadata,
      page
    );

    assert.match(frontmatter, /^---\n/);
    assert.match(frontmatter, /\nseries: "Deep Dive"\n/);
    assert.match(frontmatter, /\npart: 2\n/);
    assert.match(frontmatter, /\n---$/);
  });

  it("omits series and part when Series is missing", async () => {
    const page = buildPage({
      Part: {
        number: 1,
      },
    });

    const frontmatter = await convertPropertiesToJekyllFrontmatter(
      metadata,
      page
    );

    assert.equal(frontmatter.includes("\nseries:"), false);
    assert.equal(frontmatter.includes("\npart:"), false);
  });

  it("omits series and part when Part is missing", async () => {
    const page = buildPage({
      Series: {
        rich_text: [{ plain_text: "Deep Dive" }],
      },
      Part: {
        number: null,
      },
    });

    const frontmatter = await convertPropertiesToJekyllFrontmatter(
      metadata,
      page
    );

    assert.equal(frontmatter.includes("\nseries:"), false);
    assert.equal(frontmatter.includes("\npart:"), false);
  });

  it("still requires core frontmatter fields", async () => {
    const page = buildPage({
      Description: {
        rich_text: [],
      },
    });

    await assert.rejects(
      () => convertPropertiesToJekyllFrontmatter(metadata, page),
      /Description is required in frontmatter/
    );
  });
});
