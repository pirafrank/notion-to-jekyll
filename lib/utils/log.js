const log = (message, level) => {
  console.log(`${level}: ${message}`);
}

const info = (message) => {
  log(message, "INFO");
}

module.exports = {
  info,
};
