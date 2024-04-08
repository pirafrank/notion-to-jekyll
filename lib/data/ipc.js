// ipc for dummies

const ipc = {
  push: (array, item) => {
    if (!array.includes(item)) {
      array.push(item);
    }
  },
  data: {
    changed: [],
    deleted: [],
  }
};

module.exports = {
  ipc,
};
