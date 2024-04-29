require('dotenv').config();
const path = require("path");
const yargs = require('yargs');
const CURRENT_VERSION = require("./package.json").version;
const { info, error } = require("./lib/utils/log");
const { initConfig } = require("./lib/config/config");
const {
  checkForFileInFolder,
  createDirectory,
  copyFile,
  appendLineToFile,
} = require("./lib/utils/fs");
const {
  initNotionClient,
  getBlogPostsToPublish,
} = require("./lib/clients/notion");
const { initNotionToMarkdownConverter } = require("./lib/clients/converter");
const { parseResults } = require("./lib/process/process");
const { ipc } = require("./lib/data/ipc");


const GITHUB_WORKSPACE_MOUNT = "/github/workspace/";

const removePrefixFromStringArray = (array, prefix) => {
  return array.map((item) => {
    if(!item.startsWith(prefix)) return item;
    return item.replace(prefix, "");
  });
}

const populateGithubOutputFile = (config, data) => {
  // if we run in GitHub Action, to action output
  if(!process.env.GITHUB_OUTPUT) return;
  // removing docker mount from file paths to have them passed
  // as relative paths in the GitHub Action workspace
  const changedFiles = removePrefixFromStringArray(data.changed, GITHUB_WORKSPACE_MOUNT);
  const deletedFiles = removePrefixFromStringArray(data.deleted, GITHUB_WORKSPACE_MOUNT);
  const isDirty = changedFiles.length + deletedFiles.length > 0 ? true : false;
  writeResultToGithubOutputFile([
    { label: "dry-run", value: config.dryRun.toString() },
    { label: "changed", value: changedFiles.join(" ") },
    { label: "deleted", value: deletedFiles.join(" ") },
    { label: "succeeded", value: data.succedeed.join(";") },
    { label: "failed", value: data.failed.join(";") },
    { label: "dirty", value: isDirty.toString() }
  ]);
};

const writeResultToGithubOutputFile = (results) => {
  info(`Writing results to ${process.env.GITHUB_OUTPUT}`);
  const line = results.reduce((acc, i) => {
    return acc + `${i.label}=${i.value}\n`;
  }, "");
  appendLineToFile(process.env.GITHUB_OUTPUT, line);
};

const main = async (args) => {
  info(`notion-to-jekyll started.`);

  // get script current directory
  const scriptDir = path.dirname(__filename);
  info(`Current script directory: ${scriptDir}`);

  try {
    const config = initConfig(args);
    config.dryRun && info(`Running in dry-run mode.`);
    info(`Using date: ${config.date}`);
    info(`Using Jekyll root directory: ${config.jekyllRoot}`);
    info(`Using output directory: ${config.outputPath}`);

    if(!checkForFileInFolder(config.jekyllRoot, config.notionToJekyllCache)) {
      info(`${config.notionToJekyllCache} missing from ${config.jekyllRoot}. Copying...`);
      copyFile(
        path.join(scriptDir, config.notionToJekyllCache),
        path.join(config.jekyllRoot, config.notionToJekyllCache),
        false  // always copy or cache import will fail
      );
    }

    createDirectory(config.postsPath);
    createDirectory(config.draftsPath);
    createDirectory(config.assetsPath);

    initNotionClient(config.notionToken);
    initNotionToMarkdownConverter();

    const posts = await getBlogPostsToPublish(config);
    await parseResults(posts);

    populateGithubOutputFile(config, ipc.data());

    return 0;
  } catch (err) {
    error(`Error: ${err.message}`);
    return err.code ? err.code : 1;
  }
}

// Define the command to run
yargs
  .command({
    command: "$0",
    describe: "Run the notion-to-jekyll script",
    builder: (yargs) => {
      return yargs.option("dry-run", {
        alias: "d",
        describe: "Run the script in dry-run mode",
        type: "boolean",
        default: false,
      });
    },
    handler: async (argv) => {
      // Run the main function
      const result = await main(argv);
      info(`All done, exit code: ${result}`);
      process.exit(result);
    },
  })
  .version(CURRENT_VERSION)
  .demandCommand(1, "You need to specify a command to run")
  .help()
  .alias({
    h: "help",
    v: "version",
  }).argv;
