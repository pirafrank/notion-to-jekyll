module.exports = {
  // notion to Jekyll config and cache file
  notionToJekyllCache: ".notion-to-jekyll.json",
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
  jekyllRoot: process.env.JEKYLL_ROOT,
  // jekyll relative path on filesystem used to store drafts
  draftsDir: process.env.DRAFTS_DIR || "_drafts",
  // jekyll relative path on filesystem used to store posts
  postsDir: process.env.POSTS_DIR || "_posts",
  // jekyll _posts subdir used to store accordions
  accordionsDir: process.env.ACCORDIONS_DIR || "accordions",
  // jekyll relative path used to store images and other assets.
  // used to calculate both filepath and published URL of assets.
  assetsDir: process.env.ASSETS_DIR || "assets",
  // site URL, used to publish images
  siteUrl: process.env.SITE_URL,
  // site base URL, used to publish images
  siteBaseurl: process.env.SITE_BASEURL || "",
  // notion-to-jekyll user, used to filter out pages published by this app
  // to avoid infinite loops
  notionToJekyllUser: process.env.NOTION_TO_JEKYLL_USER || "notion-to-jekyll",
  // notion page type to filter which pages to process
  notionPageType: process.env.NOTION_PAGE_TYPE ||  "Blog post",
  // status of 'Ready' in Notion to set pages as ready to publish.
  notionReadyStatus: process.env.NOTION_READY_STATUS || "Ready",
  // status of 'Done' in Notion to set pages as published.
  // this is used when PUBLISH_TO_POSTS is set to true.
  notionDoneStatus: process.env.NOTION_DONE_STATUS || "Done",
};
