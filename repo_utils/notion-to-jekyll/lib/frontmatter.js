
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
    title: null,
    subtitle: null,
    description: null,
    category: [],
    tags: [],
    seoimage: null,
  };
}

const arrayToString = (arr) => {
  return `[ ${arr.join(", ")} ]`;
};

const escapeDoubleQuotes = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/"/g, '\\"');
}

const surroundWithQuotes = (str) => {
  return `"${str}"`;
}

const valueToString = (value) => {
  if (typeof value === "string") {
    return surroundWithQuotes(escapeDoubleQuotes(value));
  } else if (Array.isArray(value)) {
    const escaped = value.map((s) => valueToString(s));
    return arrayToString(escaped);
  } else {
    return String(value);
  }
};

const getFrontmatterAsString = (frontmatter) => {
  return `---\n${Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${valueToString(value)}`)
    .join("\n")}\n---`;
};

const extractPropertiesFromPage = (page) => {
  const properties = page?.properties;
  const frontmatter = getFrontmatterTemplateObject();

  frontmatter.title = properties?.Name?.title[0]?.plain_text;
  frontmatter.subtitle = properties?.Subtitle?.rich_text[0]?.plain_text;
  frontmatter.description = properties?.Description?.rich_text[0]?.plain_text;
  frontmatter.category.push(properties?.Category?.select?.name);
  frontmatter.tags = properties?.Tags?.multi_select.map((t) => t.name);
  // TODO: handle SEO image asset download
  //frontmatter.seoimage = properties?.SEOImage?.url;

  return frontmatter;
}

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

const convertPropertiesToJekyllFrontmatter = (page) => {
  const frontmatter = extractPropertiesFromPage(page);
  validateFrontmatter(frontmatter);
  return getFrontmatterAsString(frontmatter);
};

module.exports = {
  convertPropertiesToJekyllFrontmatter,
};
