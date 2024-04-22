// ipc for dummies


const _data = {
  changed: [],
  deleted: [],
  succedeed: [],
  failed: [],
}

const ipc = {
  push: (arrayName, item) => {
    if(!_data[arrayName]) return
    // dedup on insert
    if (!_data[arrayName].includes(item)) {
      _data[arrayName].push(item);
    }
  },
  data: () => {
    // if a file is both arrays, it means it was changed.
    // we remove it from the deleted array.
    _data.deleted = _data.deleted.filter((item) => !_data.changed.includes(item));
    return _data;
  },
  changed: "changed",
  deleted: "deleted",
  succedeed: "succedeed",
  failed: "failed",
};

module.exports = {
  ipc,
};
