module.exports = (_list, id, cb) => {
    if (!_list.list.find((v) => id === v.id)) {
        cb(undefined);
    }
    _list.list.find((v) => {
        if (v.id == id) {
            cb(v);
        }
    });
};