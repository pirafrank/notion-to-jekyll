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

const firstStringNotNull = (strings) => {
  for (const str of strings) {
    if (str) return str;
  }
  return null;
};

const uuidToBase58 = (uuid) => {
  uuid = uuid.replace(/-/g, "");
  const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const base = BigInt(58);
  const zero = BigInt(0);
  const base58uuid = [];
  let num = BigInt(`0x${uuid}`);
  while (num > zero) {
    const remainder = num % base;
    num = num / base;
    base58uuid.unshift(base58[remainder]);
  }
  return base58uuid.join("");
};

module.exports = {
  arrayToString,
  escapeDoubleQuotes,
  surroundWithQuotes,
  valueToString,
  firstStringNotNull,
  uuidToBase58,
};
