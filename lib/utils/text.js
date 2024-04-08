const arrayToString = (arr) => {
  return `[ ${arr.join(", ")} ]`;
};

const escapeDoubleQuotes = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/"/g, '\\"');
}

const surroundWithQuotes = (str) => {
  return `"${str}"`;
}

const valueToString = (value) => {
  if (typeof value === "string") {
    return surroundWithQuotes(escapeDoubleQuotes(value));
  } else if (Array.isArray(value)) {
    const escaped = value.map((s) => valueToString(s));
    return arrayToString(escaped);
  } else {
    return String(value);
  }
};

module.exports = {
  arrayToString,
  escapeDoubleQuotes,
  surroundWithQuotes,
  valueToString,
};
