const fs = require("fs");
const crypto = require("crypto");
const {
  filenamemify,
  checkForSlugInFolder,
  getFolderWithMaxIdInPath,
} = require("./fs");
const {
  configNotionToMarkdownTransformers,
  getNotionToMarkdownConverter,
} = require("./clients");
const { convertPropertiesToJekyllFrontmatter } = require("./frontmatter");

// TODO:
// - create a wrapper function to write a file to disk
// - create a wrapper function to delete a file on disk, if it exists

const calculateMdFilename = (date, pageSlug) => {
  const filename = `${date}-${pageSlug}.md`;
  console.log(`Calculated filename: ${filename}\n\tfor page slug: ${pageSlug}`);
  return filename;
};

const processPage = async (page, config) => {
  const n2m = getNotionToMarkdownConverter();
  const date = config.date;
  const outputPath = config.outputPath;
  const processResult = {};
  const targetAssetDir = getFolderWithMaxIdInPath(config.assetsPath) + 1;

  processResult.pageId = page.id;
  processResult.hash = crypto.createHash("sha256").update(page.id).digest("hex");
  processResult.targetAssetDir = targetAssetDir;
  processResult.targetAssetPath = `${config.assetsPath}/${targetAssetDir}`;
  // init to true to create the asset dir only once per Notion page processing
  processResult.createFolder = true;
  processResult.pageUrl =
    `https://www.notion.so/${processResult.pageId.replace(/-/g,"")}`;
  processResult.pageName = page?.properties?.Name?.title[0]?.plain_text;
  processResult.pageSlug = filenamemify(processResult.pageName);

  // convert Notion page properties to Jekyll frontmatter
  let frontmatter = null;
  try {
    frontmatter = await convertPropertiesToJekyllFrontmatter(
      processResult, page?.properties
    );
  } catch (error) {
    console.error(`Error converting properties to frontmatter for page '${processResult.pageName}'.`, error.message);
    processResult.action = "frontmatterError";
    return processResult;
  }

  // configure the transformers for current Notion page processing
  configNotionToMarkdownTransformers(processResult);
  // actually convert the page content to markdown and process the blocks
  const mdBlocks = await n2m.pageToMarkdown(processResult.pageId);
  const mdString = await n2m.toMarkdownString(mdBlocks);
  const mdContent = mdString?.parent;

  // calculate the output filename
  let filename = calculateMdFilename(date, processResult.pageSlug);
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
      fs.writeFileSync(filepath, `${frontmatter}\n${mdContent}`);
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

  console.log(`Found ${results.length} blog posts to publish.`);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    const pageName = page?.properties?.Name?.title[0]?.plain_text;
    console.log(`Processing page '${pageName}'`);
    try {
      const processResult = await processPage(page, config);
      if(processResult.action.toLowerCase().includes("error")) {
        console.error(`Error: Caught ${processResult.action} while processing page '${pageName}'. Skipping page.`);
        continue;
      }
      console.log(
        `Processed page: ${processResult.pageName} (${processResult.pageUrl})`
      );
    } catch (error) {
      console.error(`Error while processing page '${pageName}'. Skipping page.`, error.message);
    }
  }
};

module.exports = {
  parseResults,
};
