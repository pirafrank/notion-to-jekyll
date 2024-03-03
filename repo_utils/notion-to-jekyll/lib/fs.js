const fs = require("fs");

/**
 * we can either set the REPO_DIR env var to the absolute path of the repo
 * or assume we run inside it and set REPO_DIR as a relative path to the
 * current working directory of the shell from where the script is launched
 * (process.cwd()).
 * @returns
 */
const getRepoRoot = (dirpath) => {
  return dirpath.startsWith("/") ? dirpath : process.cwd() + "/" + dirpath;
};

const createDirectories = (dirPath) => {
  const directories = dirPath.split("/");
  let currentPath = "";
  directories.forEach((dir) => {
    currentPath += dir + "/";
    if (!fs.existsSync(currentPath)) {
      console.log(`Creating directory: ${currentPath}`);
      fs.mkdirSync(currentPath);
    }
  });
};

const checkForSlugInFolder = (dir, pageSlug) => {
  const files = fs.readdirSync(dir);
  const match = files.find((file) => file.includes(pageSlug));
  return match ? match : null;
};

module.exports = {
  getRepoRoot,
  createDirectories,
  checkForSlugInFolder,
};
