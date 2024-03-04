const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * we can either set the REPO_DIR env var to the absolute path of the repo
 * or assume we run inside it and set REPO_DIR as a relative path to the
 * current working directory of the shell from where the script is launched
 * (process.cwd()).
 * @returns
 */
const getAbsoluteRepoRoot = (dirpath) => {
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

const readYamlFile = (filepath) => {
  try {
    const data = fs.readFileSync(filepath, "utf8");
    const parsedData = yaml.load(data);
    return parsedData;
  } catch (e) {
    console.error(`Error reading YAML file: ${e}`);
    throw e;
  }
};

const listDirsInPath = (dirPath) => {
  return (
    fs
      .readdirSync(dirPath)
      // get only directories
      .filter((item) => fs.statSync(path.join(dirPath, item)).isDirectory())
  );
}

const getFolderWithMaxIdInPath = (dirPath) => {
  return (
    listDirsInPath(dirPath)
      // filter items with only numbers in name
      .filter((item) => /^\d+$/.test(item))
      // convert to numbers
      .map((item) => parseInt(item, 10))
      // get biggest one
      .sort((a, b) => b - a)[0]
  );
}

const writeObjectToJsonFile = (filepath, object) => {
  try {
    fs.writeFileSync(filepath, JSON.stringify(object, null, 2));
  } catch (e) {
    console.error(`Error writing object to JSON file: ${e}`);
    throw e;
  }
};

const writeObjectToYamlFile = (filepath, object) => {
  try {
    fs.writeFileSync(filepath, yaml.dump(object));
  } catch (e) {
    console.error(`Error writing object to YAML file: ${e}`);
    throw e;
  }
};

module.exports = {
  getAbsoluteRepoRoot,
  createDirectories,
  checkForSlugInFolder,
  readYamlFile,
  listDirsInPath,
  getFolderWithMaxIdInPath,
  writeObjectToJsonFile,
  writeObjectToYamlFile,
};
