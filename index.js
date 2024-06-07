const login = require("./src/fb-chat-api/index");
const utils = require("./src/utils");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const ipInfo = require("ipinfo");
const path = require("path");
const Server = require("@igorkowalczyk/repl-uptime");
const envfile = require("envfile");
require("dotenv").config();

ipInfo((err, cLoc) => {
    console.log(err || cLoc);
});

let folder_dir = ["/cache", "/data", "/log"];
for (let folder in folder_dir) {
    writeFolder(__dirname + folder_dir[folder]);
}

let data_json = ["groups", "accountPreferences", "threadPreferences", "users"];
for (let file in data_json) {
    writeFile(__dirname + "/data/" + data_json[file] + ".json", fs.readFileSync(__dirname + "/src/default/" + data_json[file] + ".json", "utf8"));
}

const env_dir = path.join(__dirname, ".env");
if (!fs.existsSync(env_dir)) {
    fs.writeFileSync(env_dir, fs.readFileSync(path.join(__dirname, ".env.example"), "utf8"), "utf8");
}

let settings = JSON.parse(fs.readFileSync(__dirname + "/data/accountPreferences.json", "utf8"));
let settingsThread = JSON.parse(fs.readFileSync(__dirname + "/data/threadPreferences.json", "utf8"));
let users = JSON.parse(fs.readFileSync(__dirname + "/data/users.json", "utf8"));
let groups = JSON.parse(fs.readFileSync(__dirname + "/data/groups.json", "utf8"));
let processEnv = envfile.parseFileSync(".env");

const pictographic = /\p{Extended_Pictographic}/gu;
const latinC = /[^a-z0-9-\-\s]/gi;
const normalize = /[\u0300-\u036f|\u00b4|\u0060|\u005e|\u007e]/g;

let crashes = 0;
let crashLog = "";
let cmd = {};
let acGG = [];
let emo = [];
let msgs = {};
let thread = {};
let accounts = [];
let commandCalls = 0;

process.on("SIGHUP", function () {
    process.exit(0);
});

process.on("SIGTERM", function () {
    process.exit(0);
});

process.on("SIGINT", function () {
    process.exit(0);
});

process.on("uncaughtException", (err, origin) => {
    handleError({ stacktrace: err });
});

process.on("unhandledRejection", (reason, promise) => {
    handleError({ stacktrace: reason });
});

process.on("beforeExit", (code) => {
    utils.log("process_before_exit " + code);
});

process.on("exit", (code) => {
    console.log("");
    saveState();
    utils.log("save_state ");
    utils.log("fca_status offline");
});

task(function () {
    saveState();
    utils.log("save_state called");
}, Math.floor(1800000 * Math.random() + 1200000));
utils.log("task_save_state global initiated");

task(function () {
    let size = users.blocked.length;
    users.blocked = [];
    utils.log("unblock_user " + size + " users have been unblocked.");
}, 60 * 240 * 1000);
utils.log("task_unblock global initiated");

task(function () {
    deleteCacheData(false);
    utils.log("clear_list User: " + Object.keys(cmd).length + " Group: " + acGG.length + " Command Call: " + commandCalls);
    cmd = {};
    acGG = [];
    commandCalls = 0;
}, 60 * 30 * 1000);
utils.log("task_clear global initiated");


login({ appState: JSON.parse(fs.readFileSync("session.json", "utf8")) }, (err, api) => {
    if (err) return handleError({ stacktrace: err });

    function sendGreeting(message, time) {
        cron.schedule(
            `0 ${time} * * *`,
            () => {
                api.getThreadList(25, null, ["INBOX"], (err, data) => {
                    if (err) return console.error(`Error [Thread List Cron (${message})]: ` + err);
                    let i = 0;
                    let j = 0;
                    utils.log(` ${message}`);
                    while (j < 20 && i < data.length) {
                        if (data[i].isGroup && data[i].name !== data[i].threadID) {
                            api.sendMessage(`› ${message}!\n${message === "Good morning" ? "Have a great day!" : "Have a nice day!"}`, data[i].threadID, (err) => {
                                if (err) return;
                            });
                            j++;
                        }
                        i++;
                    }
                });
            },
            {
                scheduled: true,
                timezone: "Asia/Manila",
            }
        );
    }

    sendGreeting("Good morning", "8");
    sendGreeting("Good noon", "11");
    sendGreeting("Good afternoon", "13");
    sendGreeting("Good evening", "19");
    sendGreeting("Good night", "22");

    function sendQuote(message, time) {
        cron.schedule(
            `0 ${time} * * *`,
            () => {
                api.getThreadList(25, null, ["INBOX"], (err, data) => {
                    if (err) return console.error(`Error [Thread List Cron (${message})]: ` + err);
                    let i = 0;
                    let j = 0;
                    utils.log(` ${message}`);
                    let rqt = qt();
                    rqt.then((response) => {
                        while (j < 20 && i < data.length) {
                            if (data[i].isGroup && data[i].name != data[i].threadID) {
                                api.sendMessage(`› ${message}\n\n` + response.q + "\n\n- " + response.a, data[i].threadID, (err) => {
                                    if (err) return;
                                });
                                j++;
                            }
                            i++;
                        }
                    });
                });
            },
            {
                scheduled: true,
                timezone: "Asia/Manila",
            }
        );
    }

    sendQuote("Nightime Quote!", "20");
    sendQuote("Morning Quote!", "8");

    api.setOptions({
        logLevel: "silent",
        listenEvents: true,
        selfListen: false,
        online: true,
        forceLogin: true,
        autoMarkDelivery: false,
    });


    api.listenMqtt(async (err, event) => {
        if (err) return handleError({ stacktrace: err });

        if (event.type == "message" || event.type == "message_reply") {
            let input = event.body;
            let query = formatQuery(input);

            if (testCommand(api, event, query, "restart", event.senderID, "root", true)) {
                saveState();
                let rs = [];
                rs.push(event.threadID);
                rs.push(event.messageID);
                rs.push(api.getCurrentUserID());
                settings.shared["restart"] = rs;
                sendMessage(api, event, "Restarting program...");
                await sleep(2000);
                process.exit(0);
            }

            if (event.senderID != api.getCurrentUserID() && event.isGroup) {
                if (!thread[event.threadID]) {
                    thread[event.threadID] = [100050076673558];
                    thread[event.threadID].push(event.senderID);
                } else if (thread[event.threadID].length < 2) {
                    thread[event.threadID].push(event.senderID);
                } else {
                    thread[event.threadID].shift();
                    thread[event.threadID].push(event.senderID);
                }
            }
            if (!groups.list.find((thread) => event.threadID === thread.id) && event.isGroup) {
                api.getThreadInfo(event.threadID, (err, gc) => {
                    if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID() });

                    let par = gc.participantIDs;
                    let newThread = { id: event.threadID, members: par.length };

                    if (gc.threadName) {
                        newThread["name"] = gc.threadName;
                    }

                    newThread["created_date"] = new Date().toISOString();

                    groups.list.push(newThread);

                    utils.log("new_group " + event.threadID + " group_name " + gc.threadName);
                });
            } else if (!acGG.includes(event.threadID) && groups.list.find((thread) => event.threadID === thread.id)) {
                acGG.push(event.threadID);
            }
        }




        switch (event.type) {
            case "message": {
                aiResponse(api, event);
                saveEvent(api, event);
                break;
            }
            case "message_reply": {
                aiResponse(api, event);
                saveEvent(api, event);
                break;
            }
            case "event": {
                if (event.author && event.author == api.getCurrentUserID()) {
                    break;
                }
                utils.log("event_message_type " + event.threadID + " " + event.logMessageType);
                switch (event.logMessageType) {
                    default: {
                        utils.log("unsupported_event_message_type " + event.threadID + " " + JSON.stringify(event));
                        break;
                    }
                    case "log:group_participants_add": {
                        api.getThreadInfo(event.threadID, async (err, gc) => {
                            if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
                            updateGroupData(gc, event.threadID);

                            if (event.logMessageData.addedParticipants.length == 1 && accounts.includes(event.logMessageData.addedParticipants[0].userFbId)) {
                                utils.log("event_log_subsribe " + event.threadID + " ROOT " + api.getCurrentUserID());
                                return;
                            }

                            let gname = gc.threadName;
                            let i = 0;
                            let names = [];
                            let mentioned = [];
                            let i2 = 0;
                            while (i2 < event.logMessageData.addedParticipants.length) {
                                if (!event.logMessageData.addedParticipants[i2]) {
                                    break;
                                }
                                let partID = event.logMessageData.addedParticipants[i2].userFbId;
                                let partName = event.logMessageData.addedParticipants[i2].fullName;
                                if (partID != api.getCurrentUserID() && !users.blocked.includes(partID) && !users.bot.includes(partID)) {
                                    names.push([partID, partName]);
                                    i++;
                                    mentioned.push({
                                        tag: partName,
                                        id: partID,
                                    });
                                }
                                i2++;
                            }
                            const greetings = ["Wassup,", "Welcome,", "Supp,", "Wazzup,"];
                            const getRandomGreeting = () => greetings[Math.floor(Math.random() * greetings.length)];
                            let gret;
                            if (i > 1) {
                                gret = getRandomGreeting();
                                for (let a in names) {
                                    if (a == names.length - 1) {
                                        gret += " and " + names[a][1] + "!";
                                    } else {
                                        gret += " " + names[a][1] + ",";
                                    }
                                    utils.log("new_member_multi " + names[a][0] + " " + names[a][1]);
                                }
                                gret += " Welcome to " + gname + ". How is everyone doing?";
                            } else if (i > 0) {
                                gret = getRandomGreeting() + " " + names[0][1] + ". How are you?";
                                utils.log("event_log_subsribe " + event.threadID + " " + names[0][0] + " " + names[0][1]);
                            } else {
                                return;
                            }

                            try {
                                sendMessage(api, event, gret, event.threadID);
                            } catch (err) {
                                sendMessage(api, event, handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event }));
                            }
                        });
                        break;
                    }
                    case "log:group_participants_left": {
                        let id = event.logMessageData.leftParticipantFbId;
                        if (accounts.includes(id)) {
                            for (let threads in settingsThread) {
                                if (settingsThread[threads].lock && settingsThread[threads].lock == id) {
                                    delete settingsThread[threads]["lock"];
                                }
                            }
                        }

                        if (id == api.getCurrentUserID()) return utils.log("account_kick " + id);

                        api.getThreadInfo(event.threadID, (err, gc) => {
                            if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });

                            updateGroupData(gc, event.threadID);

                            api.getUserInfo(id, (err, data) => {
                                if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });

                                updateUserData(data, id);

                                if (users.blocked.includes(id) || users.bot.includes(id)) {
                                    return;
                                } else if (data[id].name == "Facebook user") {
                                    sendMessage(api, event, "A user left the group.");
                                    utils.log("event_log_unsubsribe " + event.threadID + " " + id);
                                } else {
                                    if (settingsThread.leave && !accounts.includes(id) && !users.admin.includes(id) && settings.default.owner != event.senderID && process.env.ROOT != event.senderID) {
                                        api.addUserToGroup(id, event.threadID, (err) => {
                                            if (err) {
                                                if (err.error == 1545052) {
                                                    return sendMessage(api, event, data[id].firstName + " couldn't be added to the group.");
                                                }
                                                return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
                                            }
                                        });
                                    } else {
                                    }
                                }
                            });
                        });
                        break;
                    }
                }
                break;
            }
        }


    });
});









async function aiResponse(api, event) {
    let input = event.body;
    let query = formatQuery(input);

    if (query.startsWith("chika") || query.startsWith("ai")) {
        if (isGoingToFast(api, event)) return;

        let data = query.split(" ");
        if (data.length < 2) {
            sendMessage(api, event, "Hello");
            return;
        } else {
            data.shift();

            getResponseData("https://deku-rest-api-3ijr.onrender.com/gpt4?prompt=" + data.join(" ") + "&uid=" + event.senderID)
                .then((response) => {
                    sendMessage(api, event, response.gpt4);
                })
                .catch((err) => {
                    handleError({ stacktrace: err });
                });
        }
    }
}

async function getResponseData(url) {
    utils.log("response_data " + url);
    let data = await axios
        .get(encodeURI(url))
        .then((response) => {
            if (!response.data.error) {
                return response.data;
            } else {
                handleError({ stacktrace: response });
                return null;
            }
        })
        .catch((err) => {
            handleError({ stacktrace: err });
            return null;
        });
    return data;
}

function saveEvent(api, event) {
    if (accounts.includes(event.senderID)) {
        return;
    }
    if (event.attachments.length != 0) {
        utils.log("event_attachment " + event.threadID + " " + event.attachments[0].type);
        switch (event.attachments[0].type) {
            case "error": {
                utils.log("event_attachment_error " + event.threadID + " " + JSON.stringify(event.attachments));
                break;
            }
            case "photo": {
                let photo = [];
                for (let i in event.attachments) {
                    photo.push(event.attachments[i].url);
                }
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "photo",
                        message: event.body == "" ? " " : event.body,
                        attachment: photo,
                        mention: event.mentions,
                    },
                ];
                break;
            }
            case "animated_image": {
                let animated_images = [];
                for (let i1 in event.attachments) {
                    animated_images.push(event.attachments[i1].url);
                }
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "animated_images",
                        message: event.body == "" ? " " : event.body,
                        attachment: animated_images,
                        mention: event.mentions,
                    },
                ];
                break;
            }
            case "sticker": {
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "sticker",
                        attachment: event.attachments[0].ID,
                    },
                ];
                break;
            }
            case "video": {
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "video",
                        message: event.body == "" ? " " : event.body,
                        attachment: event.attachments[0].url,
                        mention: event.mentions,
                    },
                ];
                break;
            }
            case "audio": {
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "audio",
                        message: event.body == "" ? " " : event.body,
                        attachment: event.attachments[0].url,
                        mention: event.mentions,
                    },
                ];
                break;
            }
            case "file": {
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "file",
                        message: event.body == "" ? " " : event.body,
                        attachment_name: event.attachments[0].filename,
                        attachment_url: event.attachments[0].url,
                        mention: event.mentions,
                    },
                ];
                break;
            }
            case "location": {
                msgs[event.messageID] = [
                    {
                        time: new Date().getTime(),
                        sender: event.senderID,
                        thread: event.threadID,
                        type: "location",
                        attachment_address: event.attachments[0].address,
                        attachment_url: event.attachments[0].url,
                    },
                ];
                break;
            }
            case "share": {
                try {
                    msgs[event.messageID] = [
                        {
                            time: new Date().getTime(),
                            sender: event.senderID,
                            thread: event.threadID,
                            type: "location_sharing",
                            attachment_title: event.attachments[0].title,
                            attachment_location_latitude: event.attachments[0].target.coordinate["latitude"],
                            attachment_location_longitude: event.attachments[0].target.coordinate["longitude"],
                        },
                    ];
                } catch (err) {
                    let finalU = event.attachments[0].url;
                    if (/(http(s?)):\/\//i.test(finalU) && finalU.includes("facebook.com/reel/")) {
                        msgs[event.messageID] = [
                            {
                                time: new Date().getTime(),
                                sender: event.senderID,
                                thread: event.threadID,
                                type: "message",
                                message: event.body == "" ? " " : event.body,
                                mention: event.mentions,
                            },
                        ];
                    } else {
                        msgs[event.messageID] = [
                            {
                                time: new Date().getTime(),
                                sender: event.senderID,
                                thread: event.threadID,
                                type: "share",
                                message: event.body == "" ? " " : event.body,
                                attachment: event.attachments[0].url,
                                mention: event.mentions,
                            },
                        ];
                    }
                }
                break;
            }
        }
    } else {
        msgs[event.messageID] = [
            {
                time: new Date().getTime(),
                sender: event.senderID,
                thread: event.threadID,
                type: "message",
                message: event.body == "" ? " " : event.body,
                mention: event.mentions,
            },
        ];
    }
}

function testCommand(api, event, message, prefix, senderID, permission, regex) {
    if (!permission) permission = "user";
    if (!regex) regex = false;

    prefix = prefix.toLowerCase().replace("--", " --");
    if (!regex) regex = false;

    if (settings.shared["block_cmd"] && settings.shared["block_cmd"].includes(prefix)) return false;

    if (regex) {
        if (prefix == message) return checkCmdPermission(api, event, permission, senderID);
        return false;
    }

    const regExp = new RegExp("(^" + prefix + "$|^" + prefix + "\\s)");
    if (regExp.test(message)) return checkCmdPermission(api, event, permission, senderID);
    return false;
}

function checkCmdPermission(api, event, permission, senderID) {
    if (permission != "user") {
        if (permission == "root") {
            if (!isMyId(senderID)) {
                utils.log("access_denied root " + senderID);
                sendMessage(api, event, "Oops! You need special permissions for that. (Root Access Required)");
                return false;
            }
            utils.log("access_granted root " + senderID);
        } else if (permission == "owner") {
            if (api.getCurrentUserID() == senderID) return true;
            if (!(settings[api.getCurrentUserID()].owner == senderID)) {
                if (!users.admin.includes(senderID) && process.env.ROOT != senderID) {
                    utils.log("access_denied user is not admin " + senderID);
                    sendMessage(api, event, "Oops! You need special permissions for that. (Admin Access Required)");
                    return false;
                }
                if (users.admin.includes(senderID) && api.getCurrentUserID() == process.env.ROOT) {
                    utils.log("access_denied access to root " + senderID);
                    sendMessage(api, event, "Oops! You need special permissions for that. (Owner Access Required)");
                    return false;
                }
                utils.log("access_granted admin " + senderID);
                return true;
            }
            utils.log("access_granted owner " + senderID);
        } else if (permission == "admin") {
            if (!users.admin.includes(senderID) && process.env.ROOT != senderID) {
                utils.log("access_denied user is not admin " + senderID);
                sendMessage(api, event, "Oops! You need special permissions for that. (Admin Access Required)");
                return false;
            }
        }
    }
    return true;
}

function isMyId(id) {
    return id == process.env.ROOT;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function reactMessage(api, event, reaction) {
    if (emo.includes(event.messageID)) {
        return;
    }
    await sleep(4000);
    if (!reaction) {
        return;
    }
    utils.log("react_message " + event.threadID + " " + reaction);
    api.setMessageReaction(
        reaction,
        event.messageID,
        (err) => {
            if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
        },
        true
    );
}

async function sendMessage(api, event, message, thread_id, message_id, no_font) {
    if (!thread_id) {
        thread_id = event.threadID;
    }
    if (!message_id) {
        message_id = event.messageID;
    }
    if (!no_font) {
        no_font = false;
    }
    if (!users.admin.includes(event.senderID) && settings.default.owner != event.senderID && !accounts.includes(event.senderID) && process.env.ROOT != event.senderID && settings.shared.delay) {
        await sleep(2000);
    }

    api.sendMessage(message, thread_id, message_id);
}

function isGoingToFast(api, event) {
    if (settings.default.maintenance && settings.default.owner != event.senderID && !users.admin.includes(event.senderID) && process.env.ROOT != event.senderID) {
        if (isGoingToFast1(event, threadMaintenance, 30)) {
            return true;
        }

        sendMessage(api, event, {
            body: "Sorry, I'm not available to chat right now. I'll be back soon.",
        });
        return true;
    }

    let eventB = event.body;
    let input = eventB.normalize("NFKC");
    commandCalls++;
    utils.log("event_body " + event.threadID + " " + input);

    if (!users.list.find((user) => event.senderID === user.id)) {
        api.getUserInfo(event.senderID, async (err, data1) => {
            if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
            utils.log("new_user " + event.threadID + " " + data1[event.senderID].name);

            let newUser = { id: event.senderID, name: data1[event.senderID].name };

            if (data1[event.senderID].firstName != "") {
                newUser["firstName"] = data1[event.senderID].firstName;
            }
            if (data1[event.senderID].vanity != "") {
                newUser["userName"] = data1[event.senderID].vanity;
            }
            if (data1[event.senderID].gender != "") {
                newUser["gender"] = data1[event.senderID].gender;
            }

            newUser["created_date"] = new Date().toISOString();

            users.list.push(newUser);

            reactMessage(api, event, ":heart:");
            api.muteThread(event.threadID, -1, (err) => {
                if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
            });
        });
    }

    if (!settings.shared.simultaneousExec || input.split(" ").length < 2) {
        return false;
    }
    if (!users.admin.includes(event.senderID)) {
        if (cmd[event.senderID]) {
            if (Math.floor(Date.now() / 1000) < cmd[event.senderID]) {
                let seconds = (cmd[event.senderID] - Math.floor(Date.now() / 1000)) % 15;
                if (seconds > 3) {
                    utils.log("block_user " + event.senderID + " " + seconds);
                    return true;
                }
                return false;
            }
        }
        cmd[event.senderID] = Math.floor(Date.now() / 1000) + 15;
        return false;
    }
    return false;
}

function formatQuery(string) {
    // remove emojis
    let str = string.replace(pictographic, "");
    // remove custom fancy fonts
    let normal = str.normalize("NFKC");
    let specialCharacters = normal.replace(normalize, "");
    // only allow letters and numbers
    let normal1 = specialCharacters.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    let latin = normal1.replace(latinC, "");
    // format to lowercase
    return latin.toLowerCase();
}

function writeFile(dir, content) {
    if (!fs.existsSync(dir)) {
        fs.writeFileSync(dir, content, "utf8");
        utils.log("writing_file " + dir);
    }
}

function writeFolder(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        utils.log("creating_dir " + dir);
    }
}

function saveState() {
    let dir = path.join(__dirname, "log", "main.log");
    if (!fs.existsSync(dir)) {
        fs.writeFileSync(dir, "", "utf8");
    }
    fs.appendFile(dir, crashLog, (err) => {
        if (err) return utils.log(err);
    });
    crashLog = "";

    if (process.env.DEBUG === "true") return;
    fs.writeFileSync(path.join(__dirname, "data", "users.json"), JSON.stringify(users), "utf8");
    fs.writeFileSync(path.join(__dirname, "data", "groups.json"), JSON.stringify(groups), "utf8");
    fs.writeFileSync(path.join(__dirname, "data", "accountPreferences.json"), JSON.stringify(settings), "utf8");
    fs.writeFileSync(path.join(__dirname, "data", "threadPreferences.json"), JSON.stringify(settingsThread), "utf8");
    fs.writeFileSync(path.join(__dirname, ".env"), envfile.stringifySync(processEnv), "utf8");
}

function task(func, time) {
    return setInterval(func, time);
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

    const errorCodes = ["R6003", "R6009", "R6018", "R6002"];
    const errorMessages = ["integer divide by 0", "floating-point support not loaded", "stack overflow", "null pointer exception", "access violation"];
    const randomErrorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
    const randomErrorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

    let ct =
        "\n\n^@^C^A>^D^A^@^P^C^AL^D^A^@^T^@^C^A" +
        "\n- project orion build __version__ github.com/mrepol742^M" +
        `\n^@^C@${randomErrorCode}^M` +
        `\n- ${randomErrorMessage}^M` +
        "\n^@      ^@${randomErrorCode}^M" +
        `\n- __error__message__^M` +
        `\n^@^R^@${randomErrorCode}^M` +
        "\n- __error__name__^M" +
        "\n^@ṻ^@^M" +
        `\n@ỹ@run-time error ^@^B^@${randomErrorCode}^M` +
        `\n- ${randomErrorMessage}^M` +
        "\n\nError ID: " +
        eid +
        "\nReport at: https://github.com/ivancotacte/ambot/issues/new";
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
        url: "https://github.com/ivancotacte/ambot/issues/new",
    };
}

function updateGroupData(gc, gid) {
    utils.getProfile(groups, gid, async function (group) {
        if (group) {
            if (gc.threadName) {
                group["name"] = gc.threadName;
            }

            let arr = gc.participantIDs;
            group["members"] = arr.length;

            group["updated_date"] = new Date().toISOString();
        }
    });
}

async function qt() {
    let qoute = await axios
        .get("https://zenquotes.io/api/random")
        .then((response) => {
            return response.data[0];
        })
        .catch((err) => {
            return "err ";
        });
    return qoute;
}

new Server({
    port: 8080,
    path: "/",
    message: "🤙 Don't let your repl go to sleep!",
    debug: true,
});