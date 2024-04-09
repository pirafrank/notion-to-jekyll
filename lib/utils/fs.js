const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { info, error, dry } = require("./log");
const { ipc } = require("../data/ipc");
const { getConfig } = require("../config/config");


const createDirectory = (dirPath) => {
  if (getConfig().dryRun) {
    dry(`would have created directory: ${dirPath}`);
    return;
  }
  const directories = dirPath.split(path.sep);
  let currentPath = "";
  directories.forEach((dir) => {
    currentPath += dir + path.sep;
    if (!fs.existsSync(currentPath)) {
      info(`Creating directory: ${currentPath}`);
      fs.mkdirSync(currentPath);
    }
  });
  // note: no need to push to ipc because git won't track empty dirs.
};

const copyFile = (source, target) => {
  if (getConfig().dryRun) {
    dry(`would have copied file "${source}" to "${target}"`);
    return;
  }
  fs.copyFileSync(source, target);
  ipc.push(ipc.data.changed, target);
  info(`Copied file ${source} to ${target}`);
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
    error(`Error reading YAML file: ${e}`);
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
    error(`Error writing object to JSON file: ${e}`);
    throw e;
  }
};

const writeObjectToYamlFile = (filepath, object) => {
  try {
    writeFileSync(filepath, yaml.dump(object));
  } catch (e) {
    error(`Error writing object to YAML file: ${e}`);
    throw e;
  }
};

const writeFileSync = (filepath, content) => {
  if (getConfig().dryRun) {
    dry(`would have written file: ${filepath}`);
    return;
  }
  try {
    fs.writeFileSync(filepath, content);
    ipc.push(ipc.data.changed, filepath);
    info(`File "${filepath}" has been written to disk!`);
  } catch (e) {
    error(`Error writing to file: ${e.message}`);
    throw e;
  }
};

const deleteFileSync = (filepath) => {
  if (getConfig().dryRun) {
    dry(`would have deleted file: ${filepath}`);
    return;
  }
  try {
    fs.unlinkSync(filepath);
    ipc.push(ipc.data.deleted, filepath);
    info(`Deleted file ${filepath}`);
  } catch (e) {
    error(`Error deleting file: ${e.message}`);
    throw e;
  }
};

const deleteFileIfExistsSync = (filepath) => {
  if (fs.existsSync(filepath)) {
    deleteFileSync(filepath);
  }
};

const appendLineToFile = (filename, line) => {
  if (getConfig().dryRun) {
    dry(`would have appended line to file: ${filename}`);
    return;
  }
  try {
    fs.appendFileSync(filename, `${line}\n`);
  } catch (e) {
    error(`Error appending line to file ${filename}: ${e.message}`);
    throw e;
  }
};

module.exports = {
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
  deleteFileSync,
  deleteFileIfExistsSync,
  appendLineToFile,
};
