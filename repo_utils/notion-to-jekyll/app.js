require('dotenv').config();
const yargs = require('yargs');
const CURRENT_VERSION = require("./package.json").version;
const { getRepoRoot, createDirectories } = require("./lib/fs");
const {
  initNotionClient,
  initNotionToMarkdownConverter,
  getBlogPostsToPublish
} = require("./lib/clients");
const { parseResults } = require("./lib/process");

const initChecks = (config) => {
  for (const key in config) {
    if (config[key] === undefined || config[key] === null) {
      throw new Error(
        `Missing configuration for key: ${key}. Please check your env vars.`
      );
    }
  }
}

const init = (args) => {
  const config = {
    // Notion integration token, used to authenticate to the Notion API
    notionToken: process.env.NOTION_TOKEN,
    // Notion Database ID, where information is sourced from
    databaseId: process.env.NOTION_DATABASE_ID,
    // global flag to determine if we publish to _posts or _drafts dir
    publishToPosts:
      process.env.PUBLISH_TO_POSTS &&
      process.env.PUBLISH_TO_POSTS.toLowerCase() === "true",
    // flag to determine if we run in dry-run mode
    dryRun: !!args?.dryRun,
    // set to today's date in the format YYYY-MM-DD.
    // we need to get today's date in the format YYYY-MM-DD, and query w/o time
    date: new Date().toISOString().split("T")[0],
    // repo root directory
    repoRoot: process.env.REPO_DIR,
  };

  initChecks(config);
  initNotionClient(config.notionToken);
  initNotionToMarkdownConverter();

  return config;
}

const main = async (args) => {
  console.log(`notion-to-jekyll started.`);

  try {
    const config = init(args);
    config.dryRun && console.log(`Running in dry-run mode.`);
    console.log(`Using date: ${config.date}`);

    const repoDir = getRepoRoot(config.repoRoot);
    console.log(`Using repo directory: ${repoDir}`);

    const draftsDir = repoDir + "/_drafts";
    const postsDir = repoDir + "/_posts";
    createDirectories(postsDir);
    createDirectories(draftsDir);

    const outputDir = config.publishToPosts ? postsDir : draftsDir;
    console.log(`Using output directory: ${outputDir}`);

    const posts = await getBlogPostsToPublish(config);
    await parseResults(posts, config, outputDir);

    return 0;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return error.code ? error.code : 1;
  }
}

// Define the command to run
yargs
  .command({
    command: "$0",
    aliases: ["r", "x", "pippo"],
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
      console.log(`All done, exit code: ${result}`);
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
