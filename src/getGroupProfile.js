module.exports = (groups, id, cb) => {
    if (!groups.list.find((thread) => id === thread.id)) {
        cb({ name: undefined });
    }
    groups.list.find((thread) => {
        if (thread.id == id) {
            cb(thread);
        }
    });
}