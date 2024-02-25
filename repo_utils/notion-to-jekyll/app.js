const dotenv = require('dotenv');
const { Client } = require("@notionhq/client")
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");

// Load environment variables from .env file
dotenv.config();
// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});
// Configuring NotionToMarkdown
const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: {
    parseChildPages: false, // default: parseChildPages
  },
});
// Notion Database ID, where information is sourced from
const fpiracomDatabaseId = process.env.NOTION_FPIRACOM_DATABASE_ID;
// global flag to determine if we publish to _posts or _drafts dir
const publishToPosts =
  process.env.PUBLISH_TO_POSTS &&
  process.env.PUBLISH_TO_POSTS.toLowerCase() === "true"

// we need to get today's date in the format YYYY-MM-DD, and query w/o time
const today = new Date().toISOString().split("T")[0];

/**
 * we can either set the REPO_DIR env var to the absolute path of the repo
 * or assume we run inside it and set REPO_DIR as a relative path to the
 * current working directory of the shell from where the script is launched
 * (process.cwd()).
 * @returns
 */
const getRepoRoot = () => {
  const repoRoot = process.env.REPO_DIR;
  if (!repoRoot) {
    throw new Error(
      "ERROR: REPO_DIR env var not set. Quitting...");
  }
  return repoRoot.startsWith("/") ? repoRoot : process.cwd() + "/" + repoRoot;
}

const createDirectories = (dirPath) => {
  const directories = dirPath.split('/');
  let currentPath = '';
  directories.forEach((dir) => {
    currentPath += dir + '/';
    if (!fs.existsSync(currentPath)) {
      console.log(`Creating directory: ${currentPath}`);
      fs.mkdirSync(currentPath);
    }
  });
};

const getBlogPostsToPublish = async () => {
    const queryResults = await notion.databases.query({
      database_id: fpiracomDatabaseId,
      filter: {
        // NB. properties are case sensitive!
        and: [
          {
            property: "Type",
            select: {
              equals: "Blog post",
            },
          },
          {
            property: "Status",
            status: {
              equals: "Ready",
            },
          },
          {
            property: "Publish Date",
            date: {
              equals: today,
            },
          },
          {
            property: "Published By",
            select: {
              does_not_equal: "notion-to-jekyll",
            },
          },
        ],
      },
    });
    // check if target object exists, quit otherwise
    if (!queryResults || !queryResults.results || !Array.isArray(queryResults.results)) {
      console.error(`No array to parse in query results: ${JSON.stringify(queryResults)}`);
      console.error("Quitting...`")
      process.exit(2);
    }
    return queryResults.results;
}

const parseResults = async (outputDir, results) => {
  if (results && results.length === 0) {
    console.log("No blog posts to publish today.");
    return;
  }

  console.log(`Found ${results.length} blog posts to publish.`);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    const processResult = await processPage(outputDir, page);
    console.log(`Processed page: ${processResult.pageName} (${processResult.pageUrl})`);
  }
}

const checkForSlugInFolder = (dir, pageSlug) => {
  const files = fs.readdirSync(dir);
  const match = files.find((file) => file.includes(pageSlug));
  return match ? match : null;
}

const processPage = async (outputDir, page) => {
  const processResult = {}
  processResult.pageId = page.id;
  processResult.pageUrl = `https://www.notion.so/${processResult.pageId.replace(/-/g, "")}`;
  processResult.pageName = page?.properties?.Name?.title[0]?.plain_text;
  processResult.pageSlug = processResult.pageName
    .toLowerCase()
    .replace(/\s/g, "-");
  const mdBlocks = await n2m.pageToMarkdown(processResult.pageId);
  const mdString = await n2m.toMarkdownString(mdBlocks);
  const mdContent = mdString?.parent;

  // calculate the output filename
  processResult.pageSlug = processResult.pageSlug
    .toLowerCase()
    .replace(" ", "-");
  const filename = `${today}-${processResult.pageSlug}.md`;
  const filepath = outputDir + `/${filename}`;
  console.log(`About to write post to file: ${filepath}`);

  // check if file already exists in target dir
  const match = checkForSlugInFolder(outputDir, processResult.pageSlug);

  // if file exists in _posts dir, skip processing.
  // I won't overwrite published posts!
  if (publishToPosts && match && match.length > 0) {
    console.log(
      `File with slug ${processResult.pageSlug} already exists in ${outputDir}
Matching filename is: ${match}
Skipping processing this page...`
    );
    processResult.action = "fileExistsInPostsDir";
    return processResult;
  }

  // if file exists in _drafts dir, delete it.
  // drafts are meant to be overwritten.
  // this works also even if a match is found for a day different from today,
  // so it's a good way to clean up old drafts and update the possibile
  // publish date of the post.
  if (!publishToPosts && match && match.length > 0) {
    console.log(
      `File with slug "${processResult.pageSlug}" already exists in ${outputDir}
Matching filename is: ${match}
Deleting matching page in dir before writing new file...`
    );
    processResult.action = "fileExistsInDraftsDir";
    // delete match in _drafts dir
    try {
      fs.unlinkSync(outputDir + `/${match}`);
      console.log(`Deleted file: ${match}`);
    } catch (err) {
      processResult.action = "onErrorDeleteFile";
      console.error(`Error deleting file ${match}: ${err.message}`);
    }
  }

  // if you got this far, it's time to write to disk.
  // try writing the blocks to a markdown file.
  try {
    fs.writeFileSync(filepath, mdContent);
    processResult.action = "writeOk";
    console.log(`File "${filename}" has been saved!`);
  } catch (err) {
    processResult.action = "onError";
    console.error(`Error writing file ${filename}: ${err.message}`);
  }
  return processResult;
}

const main = async () => {
  console.log(`notion-to-jekyll started.`);

  const repoDir = getRepoRoot();
  console.log(`Using repo directory: ${repoDir}`);

  const draftsDir = repoDir + "/_drafts";
  const postsDir = repoDir + "/_posts";
  createDirectories(postsDir);
  createDirectories(draftsDir);

  const outputDir = publishToPosts ? postsDir : draftsDir;
  console.log(`Using output directory: ${outputDir}`);

  const posts = await getBlogPostsToPublish();
  await parseResults(outputDir, posts);

  return 0;
}

// Run the main function
main()
  .then((r) => {
    console.log(`All done, exit code: ${r}`);
    process.exit(0);
  })
  .catch((error) => {
    error.message = `Error: ${error.message}`;
    process.exit(error?.code ? error.code : 1);
  });
