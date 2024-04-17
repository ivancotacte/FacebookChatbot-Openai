let func = {};

const fileNames = [
    'log',
    'getProjectTotalSize',
    'getCPULoad',
    'getGroupProfile',
    'getTimestamp',
    'generatePoster'
]

fileNames.map(function (v) {
    func[v] = require("./" + v);
});

module.exports = func;