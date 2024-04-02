const login = require('./src/login/index.js');
const utils = require('./src/login/utils.js');
const fs = require('fs');


let folder_dir = ["/cache", "/data", "/log"];
for (let folder in folder_dir) {
    writeFolder(__dirname + folder_dir[folder]);
}

let data_json = ["groups", "accountPreferences", "threadPreferences", "users", "appState"];
for (let file in data_json) {
    writeFile(__dirname + "/data/" + data_json[file] + ".json", fs.readFileSync(__dirname + "/src/data/default/" + data_json[file] + ".json", "utf8"));
}

if (!fs.existsSync(__dirname + "/.env")) {
    fs.writeFileSync(__dirname + "/.env", fs.readFileSync(__dirname + "/.env.example", "utf8"), "utf8");
    utils.log("writing_env " + __dirname + "/.env");
}

login({ appState: JSON.parse(fs.readFileSync(__dirname + "/data/appState.json", "utf8")) }), (err, api) => {
    if (err) return handleError({ stacktrace: err });
};












function writeFolder(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        utils.log("creating_dir " + dir);
    }
}

function writeFile(dir, content) {
    if (!fs.existsSync(dir)) {
        fs.writeFileSync(dir, content, "utf8");
        utils.log("writing_file " + dir);
    }
}

function handleError(err) {
    crashes++;
    utils.log(err.stacktrace);
    let eid = Math.floor(100000000 + Math.random() * 900000000);
    let cInfo = "\n\n-----------\ndate: " + new Date().toISOString();
    if (err.cuid) {
        cInfo += "\ncuid: " + err.cuid;
    }
    if (err.e) {
        cInfo += "\nevent: " + err.e;
    }
    cInfo += "\nstacktrace: " + err.stacktrace;
    crashLog += cInfo;
    let ct =
        "\n\n^@^C^A>^D^A^@^P^C^AL^D^A^@^T^@^C^A" +
        "\n- project orion build __version__ github.com/mrepol742^M" +
        "\n^@^C@R6003^M" +
        "\n- integer divide by 0^M" +
        "\n^@      ^@R6009^M" +
        "\n- __error__message__^M" +
        "\n^@^R^@R6018^M" +
        "\n- __error__name__^M" +
        "\n^@ṻ^@^M" +
        "\n@ỹ@run-time error ^@^B^@R6002^M" +
        "\n- floating-point support not loaded^M" +
        "\n\nError ID: " +
        eid +
        "\nReport at: https://github.com/mrepol742/project-orion/issues/new";
    if (err.stacktrace.name) {
        ct = ct.replace("__error__name__", err.stacktrace.name);
    } else {
        ct = ct.replace("__error__name__", "unexpected heap error");
    }
    if (err.stacktrace.message) {
        ct = ct.replace("__error__message__", err.stacktrace.message);
    } else {
        ct = ct.replace("__error__message__", "not enough space for environment");
    }
    ct = ct.replace("__version__", process.env.npm_package_version);
    return {
        body: ct,
        url: "https://github.com/mrepol742/project-orion/issues/new",
    };
}