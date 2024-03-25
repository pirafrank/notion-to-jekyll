// ipc for dummies

const _ipc = {
  data: {
    changed: [],
    deleted: [],
  }
}

const ipc = () => _ipc;

module.exports = {
  ipc,
};
