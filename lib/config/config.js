const path = require("path");
const variables = require("./variables");


let _config = null;

/**
 * we can either set the JEKYLL_ROOT env var to the absolute path of the repo
 * or assume we run inside it and set JEKYLL_ROOT as a relative path to the
 * current working directory of the shell from where the script is launched
 * (process.cwd()).
 * @returns string of the absolute path to the Jekyll root directory
 */
const getAbsoluteJekyllRoot = (dirpath) => {
  const osRoot = path.parse(dirpath).root;
  return path.normalize(
    !!osRoot ? dirpath : path.join(process.cwd(), dirpath)
  );
};

/**
 * set date to query notion API w/o time
 * @param {*} relDate integer of days before or after today
 * @returns a string in the format YYYY-MM-DD
 */
const calculateDate = (relDate) => {
  const date = new Date();
  date.setDate(date.getDate() + parseInt(relDate, 10));
  return date.toISOString().split("T")[0];
};

const calculateDateRangeFromRelativeDate = (relDate) => {
  // can't be null or empty
  if (!relDate) {
    throw new Error("Relative date can't be null or empty. Set relative number of days or range.");
  }
  // trim it
  relDate = relDate.trim();
  // can be a single date or a range
  if (!relDate.match(/^(-)?\d+(,\d+)?$/)) {
    throw new Error(
      `Invalid relative date range: ${relDate}. Please use the format "number,number".`
    );
  } else if (relDate.includes(",")) {
    const [startDate, endDate] = relDate.split(",");
    return {
      startDate: calculateDate(startDate),
      endDate: calculateDate(endDate),
    };
  } else {
    const startDate = calculateDate(relDate);
    return {
      startDate: startDate,
      endDate: startDate,
    };
  }
}

const initChecks = (config) => {
  for (const key in config) {
    if (config[key] === undefined || config[key] === null) {
      throw new Error(
        `Missing configuration for key: ${key}. Please check your env vars.`
      );
    }
  }
};

const initConfig = (args) => {
  _config = variables;

  // flag to determine if we run in dry-run mode
  _config.dryRun = !!args?.dryRun;

  // date range to query Notion API
  const range = calculateDateRangeFromRelativeDate(_config.relativeDate);
  _config.startDate = range.startDate;
  _config.endDate = range.endDate;

  // performs config checks
  initChecks(_config);

  // if checks are ok, let's add a couple of calculated fields
  // set absolute paths in config
  _config.jekyllRoot = getAbsoluteJekyllRoot(_config.jekyllRoot);
  _config.postsPath = path.join(_config.jekyllRoot, _config.postsDir);
  _config.draftsPath = path.join(_config.jekyllRoot, _config.draftsDir);
  _config.assetsPath = path.join(_config.jekyllRoot, _config.assetsDir);

  if(_config.publishToPosts) {
    _config.postsAccordionPath = path.join(_config.postsPath, _config.accordionsDir);
  } else {
    _config.postsAccordionPath = path.join(_config.draftsPath, _config.accordionsDir);
  }

  // set output directory
  _config.outputPath = _config.publishToPosts
    ? _config.postsPath
    : _config.draftsPath;

  return _config;
};

const getConfig = () => {
  if (!_config) throw new Error("Configuration not initialized.");
  return _config;
}

module.exports = {
  initConfig,
  getConfig,
};
