const orion = require('./src/orion.js');
const utils = require("./src/utils.js");
const fs = require("fs");



let folder_dir = ["/cache", "/data", "/data/cookies", "/log"];
for (let folder in folder_dir) {
    writeFolder(__dirname + folder_dir[folder]);
}

let data_json = ["groups", "accountPreferences", "threadPreferences", "users"];
for (let file in data_json) {
    writeFile(__dirname + "/data/" + data_json[file] + ".json", fs.readFileSync(__dirname + "/src/data/default/" + data_json[file] + ".json", "utf8"));
}

if (!fs.existsSync(__dirname + "/.env")) {
    fs.writeFileSync(__dirname + "/.env", fs.readFileSync(__dirname + "/.env.example", "utf8"), "utf8");
    utils.logged("writing_env " + __dirname + "/.env");
}









function writeFolder(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        utils.logged("creating_dir " + dir);
    }
}

function writeFile(dir, content) {
    if (!fs.existsSync(dir)) {
        fs.writeFileSync(dir, content, "utf8");
        utils.logged("writing_file " + dir);
    }
}