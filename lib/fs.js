const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const ipc = require("./ipc");

/**
 * we can either set the JEKYLL_ROOT env var to the absolute path of the repo
 * or assume we run inside it and set JEKYLL_ROOT as a relative path to the
 * current working directory of the shell from where the script is launched
 * (process.cwd()).
 * @returns
 */
const getAbsoluteJekyllRoot = (dirpath) => {
  return dirpath.startsWith("/") ? dirpath : process.cwd() + "/" + dirpath;
};

const createDirectory = (dirPath) => {
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

const copyFile = (source, target) => {
  fs.copyFileSync(source, target);
  ipc.data.changed.push(target);
  console.log(`Copied file ${source} to ${target}`);
};

const filenamemify = (filename) => {
  filename = filename
    .toLowerCase()
    .replace(/\s/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 50);
  const lastChar = filename.charAt(filename.length - 1);
  if (!lastChar.match(/[a-zA-Z0-9]/)) {
    filename = filename.slice(0, -1);
  }
  return filename;
};

const checkForFileInFolder = (dir, pageSlug) => {
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
  const max = listDirsInPath(dirPath)
      // filter items with only numbers in name
      .filter((item) => /^\d+$/.test(item))
      // convert to numbers
      .map((item) => parseInt(item, 10))
      // get biggest one
      .sort((a, b) => b - a)[0]
  return !max || max.toString() == "NaN" ? 1000 : max;
}

const writeObjectToJsonFile = (filepath, object) => {
  try {
    writeFileSync(filepath, JSON.stringify(object, null, 2));
  } catch (e) {
    console.error(`Error writing object to JSON file: ${e}`);
    throw e;
  }
};

const writeObjectToYamlFile = (filepath, object) => {
  try {
    writeFileSync(filepath, yaml.dump(object));
  } catch (e) {
    console.error(`Error writing object to YAML file: ${e}`);
    throw e;
  }
};

const writeFileSync = (filepath, content) => {
  try {
    fs.writeFileSync(filepath, content);
    ipc.data.changed.push(filepath);
    console.log(`File "${filepath}" has been written to disk!`);
  } catch (e) {
    console.error(`Error writing to file: ${e.message}`);
    throw e;
  }
};

const unlinkSync = (filepath) => {
  try {
    fs.unlinkSync(filepath);
    ipc.data.deleted.push(filepath);
    console.log(`Deleted file ${filepath}`);
  } catch (e) {
    console.error(`Error deleting file: ${e.message}`);
    throw e;
  }
};

const persistCache = (cachePath, cache) => {
  cache.sequence = cache.sequence + 1;
  cache.lastUpdate = new Date().toISOString();
  writeObjectToJsonFile(cachePath, cache);
  console.log(`Cache saved to ${cachePath}`);
};

module.exports = {
  getAbsoluteJekyllRoot,
  createDirectory,
  copyFile,
  filenamemify,
  checkForFileInFolder,
  readYamlFile,
  listDirsInPath,
  getFolderWithMaxIdInPath,
  writeObjectToJsonFile,
  writeObjectToYamlFile,
  writeFileSync,
  unlinkSync,
  persistCache,
};
