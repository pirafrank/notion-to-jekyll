require('dotenv').config();
const yargs = require('yargs');
const CURRENT_VERSION = require("./package.json").version;
const { initConfig } = require("./lib/init");
const { createDirectory } = require("./lib/fs");
const {
  initNotionClient,
  initNotionToMarkdownConverter,
  getBlogPostsToPublish,
} = require("./lib/clients");
const { parseResults } = require("./lib/process");

const main = async (args) => {
  console.log(`notion-to-jekyll started.`);

  try {
    const config = initConfig(args);
    config.dryRun && console.log(`Running in dry-run mode.`);
    console.log(`Using date: ${config.date}`);
    console.log(`Using repo directory: ${config.repoRoot}`);
    console.log(`Using output directory: ${config.outputPath}`);

    createDirectory(config.postsPath);
    createDirectory(config.draftsPath);
    createDirectory(config.assetsPath);

    initNotionClient(config.notionToken);
    initNotionToMarkdownConverter();

    const posts = await getBlogPostsToPublish(config);
    await parseResults(posts, config);

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
