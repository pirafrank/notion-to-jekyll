const path = require("path");
const crypto = require("crypto");
const { getConfig } = require("../config/config");
const { info, error, dry } = require("../utils/log");
const {
  filenamemify,
  checkForFileInFolder,
  getFolderWithMaxIdInPath,
  writeFileSync,
  deleteFileSync,
} = require("../utils/fs");
const { updatePublishedByAndStatusProperties } = require("../clients/notion");
const { getNotionToMarkdownConverter } = require("../clients/converter");
const { convertPropertiesToJekyllFrontmatter } = require("./frontmatter");
const { getTransformers } = require("./transformers");
const { blocksToMarkdownString } = require("./blocks");
const { ipc } = require("../data/ipc");


const configNotionToMarkdownTransformers = (metadata) => {
  const n2m = getNotionToMarkdownConverter();
  const tfx = getTransformers(n2m, metadata);
  for (i = 0; i < tfx.length; i++) {
    n2m.setCustomTransformer(
      tfx[i].blockType,
      tfx[i].transformer
    );
  }
}

const calculateMdFilename = (date, pageSlug) => {
  const filename = `${date}-${pageSlug}.md`;
  info(`Calculated filename "${filename}"`);
  return filename;
};

const initMetadata = (page) => {
  const metadata = {};
  const config = getConfig();

  // create the metadata object for the current Notion page
  metadata.pageId = page.id;
  metadata.hash = crypto.createHash("sha256").update(page.id).digest("hex");
  metadata.pageDate = config.date;
  metadata.pageUrl = `https://www.notion.so/${metadata.pageId.replace(/-/g,"")}`;
  metadata.pageName = page?.properties?.Name?.title[0]?.plain_text;
  metadata.pageSlug = filenamemify(metadata.pageName);
  metadata.filename = calculateMdFilename(metadata.pageDate, metadata.pageSlug);
  metadata.filepath = path.join(config.outputPath, metadata.filename);

  // calculate the target asset dir for the current Notion page
  const targetAssetDir = getFolderWithMaxIdInPath(config.assetsPath) + 1;
  metadata.targetAssetDir = targetAssetDir;
  metadata.targetAssetPath = path.join(config.assetsPath, targetAssetDir.toString());
  // init to true to create the asset dir only once per Notion page processing
  metadata.createFolder = true;

  return metadata;
};

const convertBlocksToMarkdown = async (metadata) => {
  // configure the transformers for current Notion page processing
  configNotionToMarkdownTransformers(metadata);
  // actually convert the page content to markdown and process the blocks
  const n2m = getNotionToMarkdownConverter();
  const mdBlocks = await n2m.pageToMarkdown(metadata.pageId);
  // workaround: toggle contents have already been written to Jekyll includes,
  //             so we trick the markdown conversion to treat toggle titles as
  //             paragraphs. we can do that because 'parent' property has
  //             already been populated by the custom transformer for toggles.
  // reference: https://github.com/souvikinator/notion-to-md/blob/37ec5811a09b31aaa5aabf0b7d9f28cbab509a89/src/notion-to-md.ts#L67
  mdBlocks.forEach(block => {
    if(!!block && block.type === 'toggle'){
      block.type = 'paragraph';
    }
  });
  const mdContent = await blocksToMarkdownString(mdBlocks);
  return mdContent;
};

const writeToFile = async (metadata, frontmatter, mdContent) => {
  try {
    const config = getConfig();
    const filepath = metadata.filepath;
    info(`About to write post to file: ${filepath}`);
    writeFileSync(filepath, `${frontmatter}\n${mdContent}`);
    if (!config.dryRun) {
      info(`Updating page properties for page: ${metadata.pageName}`);
      await updatePublishedByAndStatusProperties(
        metadata.pageId,
        config.notionToJekyllUser,
        config.notionDoneStatus
      );
    } else {
      dry(`would have updated page properties: ${filepath}`);
    }
  } catch (err) {
    error(`Error writing file ${metadata.filename}: ${err.message}`);
    throw err;
  }
};

const processPage = async (page) => {
  // first init metadata used throughout the process
  const metadata = initMetadata(page);
  info(`Calculated page slug "${metadata.pageSlug}`);
  // calculate the output filepath and filename
  const config = getConfig();
  const outputPath = config.outputPath;
  // check if file already exists in target dir
  const match = checkForFileInFolder(outputPath, metadata.pageSlug);
  if(match && match.length > 0){
    info(`File with slug "${metadata.pageSlug}" already exists `
      +`in ${outputPath}\nMatching filename is: ${match}`);
    if (config.publishToPosts) {
      // if file exists in _posts dir, skip processing.
      // I won't overwrite published posts!
      info(`Skipping processing this page...`);
      return metadata;
    } else {
      // if file exists in _drafts dir, delete it.
      // drafts are meant to be overwritten.
      // this works also even if a match is found for a day different from given
      // date, so it's a good way to clean up old drafts and update the possibile
      // publish date of the post.
      info(`Deleting matching page in dir before writing new file...`);
      deleteFileSync(path.join(outputPath,match));
    }
  }
  // if we got this far, it's time to actually work and write to disk.
  // convert Notion page properties and content
  const frontmatter = await convertPropertiesToJekyllFrontmatter(metadata, page);
  const mdContent = await convertBlocksToMarkdown(metadata);
  await writeToFile(metadata, frontmatter, mdContent);
  return metadata;
};

const parseResults = async (results) => {
  const config = getConfig();
  const date = config.date;
  if (results && results.length === 0) {
    info(`No blog posts to publish for date: ${date}.`);
    return;
  }

  info(`Found ${results.length} blog posts to publish.`);
  for (let i = 0; i < results.length; i++) {
    const page = results[i];
    const pageName = page?.properties?.Name?.title[0]?.plain_text;
    info(`Processing page '${pageName}'`);
    try {
      const result = await processPage(page);
      info(`Processed page: ${result.pageName} (${result.pageUrl})`);
      ipc.push(ipc.succedeed, result.pageName);
    } catch (err) {
      error(`Error while processing page '${pageName}'. Skipping page.`,
        err.message);
      ipc.push(ipc.failed, `${pageName}, ERROR: ${err.message}`);
    }
  }
};

module.exports = {
  parseResults,
};
