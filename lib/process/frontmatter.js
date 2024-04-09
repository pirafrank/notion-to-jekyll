const crypto = require('crypto');
const { info, error } = require('../utils/log');
const { putAssetOffline } = require('./fetch');
const { valueToString } = require('../utils/text');

//
// Template for Jekyll frontmatter:
//
// ---
// title: Some title
// subtitle: A subtitle, too.
// description: Write here a longer description about the blog post.
// category: ["Posts"]
// tags: ["Bash", "Linux", "Sys Admin"]
// seoimage: "300x/some-pic-seo.jpg"
// ---
//

const getFrontmatterTemplateObject = () => {
  return {
    title: '',
    subtitle: '',
    description: '',
    category: [],
    tags: [],
    seoimage: '',
  };
}

const getFrontmatterAsString = (frontmatter) => {
  return `---\n${Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${valueToString(value)}`)
    .join("\n")}\n---`;
};

const extractPropertiesFromPage = async (iteration, page) => {
  const properties = page?.properties;
  const frontmatter = getFrontmatterTemplateObject();
  // populating fields
  frontmatter.title = properties?.Name?.title[0]?.plain_text;
  frontmatter.subtitle = properties?.Subtitle?.rich_text[0]?.plain_text;
  frontmatter.description = properties?.Description?.rich_text[0]?.plain_text;
  frontmatter.category.push(properties?.Category?.select?.name);
  frontmatter.tags = properties?.Tags?.multi_select.map((t) => t.name);
  // handling SEO image asset download
  try {
    const seoimageUrl = properties?.seoimage?.files[0]?.file?.url;
    if (seoimageUrl) {
      const firstPart = seoimageUrl.split("?")[0];
      const hash = crypto.createHash("sha256").update(firstPart).digest("hex");
      const { filename } = await putAssetOffline(seoimageUrl, iteration, hash);
      // note: this is a path to URL, we keep fwd slash
      frontmatter.seoimage = `${iteration.targetAssetDir}/${filename}`;
    }
  } catch (err) {
    error(`Error processing SEO image for page: ${page.id}.`, err);
  }
  return frontmatter;
};

const validateFrontmatter = (frontmatter) => {
  if (!frontmatter.title) {
    throw new Error("Title is required in frontmatter.");
  }
  if (!frontmatter.description) {
    throw new Error("Description is required in frontmatter.");
  }
  if (frontmatter.category.length === 0) {
    throw new Error("Category is required in frontmatter.");
  }
  if (frontmatter.tags.length === 0) {
    throw new Error("At least one tag is required in frontmatter.");
  }
}

const convertPropertiesToJekyllFrontmatter = async (iteration, page) => {
  info("Converting Notion page properties to Jekyll frontmatter");
  const frontmatter = await extractPropertiesFromPage(iteration, page);
  validateFrontmatter(frontmatter);
  return getFrontmatterAsString(frontmatter);
};

module.exports = {
  convertPropertiesToJekyllFrontmatter,
};
