const fs = require("fs");
const crypto = require("crypto");
const {
  checkForSlugInFolder,
  getFolderWithMaxIdInPath,
  createDirectories,
} = require("./fs");
const {
  configNotionToMarkdownTransformers,
  getNotionToMarkdownConverter,
} = require("./clients");

// TODO:
// - create a wrapper function to write a file to disk
// - create a wrapper function to delete a file on disk, if it exists

const processPage = async (page, config, cache) => {
  const n2m = getNotionToMarkdownConverter();
  const date = config.date;
  const outputPath = config.outputPath;
  const processResult = {};
  const targetAssetDir = getFolderWithMaxIdInPath(config.assetsPath) + 1;

  processResult.pageId = page.id;
  processResult.hash = crypto.createHash("sha256").update(page.id).digest("hex");
  processResult.targetAssetDir = targetAssetDir;
  processResult.targetAssetPath = `${config.assetsPath}/${targetAssetDir}`;
  processResult.pageUrl =
    `https://www.notion.so/${processResult.pageId.replace(/-/g,"")}`;
  processResult.pageName = page?.properties?.Name?.title[0]?.plain_text;
  processResult.pageSlug = processResult.pageName
    .toLowerCase()
    .replace(/\s/g, "-");

  // create the target asset directory for current Notion page
  config.dryRun
    && console.log(`** Dry-run mode ** : would have created directory: ${processResult.targetAssetPath}`)
    || createDirectories(processResult.targetAssetPath);
  // configure the transformers for current Notion page processing
  configNotionToMarkdownTransformers(processResult, cache);

  const mdBlocks = await n2m.pageToMarkdown(processResult.pageId);
  const mdString = await n2m.toMarkdownString(mdBlocks);
  const mdContent = mdString?.parent;

  // calculate the output filename
  processResult.pageSlug = processResult.pageSlug
    .toLowerCase()
    .replace(" ", "-");
  const filename = `${date}-${processResult.pageSlug}.md`;
  const filepath = `${outputPath}/${filename}`;
  console.log(`About to write post to file: ${filepath}`);

  // check if file already exists in target dir
  const match = checkForSlugInFolder(outputPath, processResult.pageSlug);

  // if file exists in _posts dir, skip processing.
  // I won't overwrite published posts!
  if (config.publishToPosts && match && match.length > 0) {
    console.log(
      `File with slug ${processResult.pageSlug} already exists in ${outputPath}
Matching filename is: ${match}
Skipping processing this page...`
    );
    processResult.action = "fileExistsInPostsDir";
    return processResult;
  }

  // if file exists in _drafts dir, delete it.
  // drafts are meant to be overwritten.
  // this works also even if a match is found for a day different from given
  // date, so it's a good way to clean up old drafts and update the possibile
  // publish date of the post.
  if (!config.publishToPosts && match && match.length > 0) {
    console.log(
      `File with slug "${processResult.pageSlug}" already exists in ${outputPath}
Matching filename is: ${match}
Deleting matching page in dir before writing new file...`
    );
    processResult.action = "fileExistsInDraftsDir";
    // delete match in _drafts dir
    try {
      if (!config.dryRun) {
        fs.unlinkSync(outputPath + `/${match}`);
        console.log(`Deleted file: ${match}`);
        processResult.action = processResult.action + "DeleteOk";
      } else {
        console.log(`** Dry-run mode ** : would have deleted file: ${match}`);
      }
    } catch (err) {
      processResult.action = processResult.action + "OnErrorDeleteFile";
      console.error(`Error deleting file ${match}: ${err.message}`);
      return processResult;
    }
  }

  // if you got this far, it's time to write to disk.
  // try writing the blocks to a markdown file.
  try {
    if (!config.dryRun) {
      fs.writeFileSync(filepath, mdContent);
      processResult.action = processResult.action + "WriteOk";
      console.log(`File "${filename}" has been saved!`);
    } else {
      console.log(`** Dry-run mode ** : would have written file: ${filename}`);
    }
  } catch (err) {
    processResult.action = processResult.action + "WriteOnError";
    console.error(`Error writing file ${filename}: ${err.message}`);
  }
  return processResult;
};

const parseResults = async (results, config) => {
  const date = config.date;
  if (results && results.length === 0) {
    console.log(`No blog posts to publish for date: ${date}.`);
    return;
  }

  const cache = require(config.repoRoot + "/.notion-to-jekyll.json");
  console.log(`Loaded cache from ${config.repoRoot}/.notion-to-jekyll.json, version ${cache.version}`)

  console.log(`Found ${results.length} blog posts to publish.`);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    const processResult = await processPage(page, config, cache);
    console.log(
      `Processed page: ${processResult.pageName} (${processResult.pageUrl})`
    );
  }
};

module.exports = {
  parseResults,
};
