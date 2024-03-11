module.exports = {
  // Notion integration token, used to authenticate to the Notion API
  notionToken: process.env.NOTION_TOKEN,
  // Notion Database ID, where information is sourced from
  databaseId: process.env.NOTION_DATABASE_ID,
  // global flag to determine if we publish to _posts or _drafts dir
  publishToPosts:
    process.env.PUBLISH_TO_POSTS &&
    process.env.PUBLISH_TO_POSTS.toLowerCase() === "true",
  // set date in the format YYYY-MM-DD to query notion API w/o time
  relativeDate: process.env.RELATIVE_DATE,
  // repo root directory
  repoRoot: process.env.REPO_DIR,
  // jekyll relative path on filesystem used to store drafts
  draftsDir: "_drafts",
  // jekyll relative path on filesystem used to store posts
  postsDir: "_posts",
  // jekyll relative path used to store images and other assets.
  // used to calculate both filepath and published URL of assets.
  assetsDir: "static/postimages",
  // site URL, used to publish images
  siteUrl: process.env.SITE_URL,
  // site base URL, used to publish images
  siteBaseurl: process.env.SITE_BASEURL,
};
