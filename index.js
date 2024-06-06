const login = require("./src/fb-chat-api/index");
const utils = require("./src/utils");
const cron = require("node-cron");
const fs = require("fs");
const envfile = require("envfile");
const path = require("path");
const os = require("os");
const ipInfo = require("ipinfo");
const axios = require("axios");
const Server = require("@igorkowalczyk/repl-uptime");
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

const sizesM = ["Bytes", "KB", "MB", "GB", "TB"];
const funD = ["🤣🤣🤣", "🤣", "😆😆", "😂😂🤣🤣", "😆😆🤣", "😂😆", "😆", "ahahaahh", "hahahahhah", "haahaaa", "ahhaa😂", "hhahahah😆", "🤣🤣hahaahhaha", "hahaa😆🤣", "hahahah funny."];
const happyEE = ["haha", "ahah", "ahha", "funny ", "insane ", "lol", "lmao", "lmfao", "silly ", "laugh ", "hilarious", "absurd", "ridicolous"];
const sadEE = ["pain", "painful", "cry ", "crying ", "sad ", "tired", "sick ", "depressed", "miserable ", "heartbroken", "sorry", "traumatic", "truma", "pitiful", "depressing", "depress", "unfortunate", "awful"];
const loveEE = ["love", "thank", "delight", "pleasure", "regards", "respect", "dear", "darling", "boyfriend", "girlfriend", "sweetheart", "angel", "honey", "adore", "treasure", "devotion", "friend"];

let crashes = 0;
let crashLog = "";

const pictographic = /\p{Extended_Pictographic}/gu;
const latinC = /[^a-z0-9-\-\s]/gi;
const normalize = /[\u0300-\u036f|\u00b4|\u0060|\u005e|\u007e]/g;

let cmd = {};
let acGG = [];
let emo = [];
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

    cron.schedule(
        "*/60 * * * *",
        () => {
            utils.log("I'm still alive!");
            api.sendMessage("I'm still alive!", "100050076673558", (err) => {
                if (err) return console.error(`Error [Thread List Cron]: ` + err);
            });
        },
        {
            scheduled: true,
            timezone: "Asia/Manila",
        }
    );

    function testing(message, time) {
        cron.schedule(
            `0 ${time} * * *`,
            () => {
                api.getThreadList(25, null, ["INBOX"], (err, data) => {
                    if (err) {
                        console.error(`Error [Thread List Cron (${message})]: ` + err);
                        handleError({ stacktrace: err });
                    }
                    utils.log(`\n${message}`);
                });
            },
            {
                scheduled: true,
                timezone: "Asia/Manila",
            }
        );
    }

    function sendGreeting(message, time) {
        cron.schedule(
            `0 ${time} * * *`,
            () => {
                api.getThreadList(25, null, ["INBOX"], (err, data) => {
                    if (err) return console.error(`Error [Thread List Cron (${message})]: ` + err);
                    let i = 0;
                    let j = 0;
                    console.log(`\n${message}`);
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
                    console.log(`${message} `);
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

        if (event.type == "message" || event.type == "message_reply") {
            aiResponse(api, event);

            let input = event.body;
            let query = formatQuery(input);

            if (testCommand(api, event, query, "stats", event.senderID)) {
                if (isGoingToFast(api, event)) return;
                let stat = [
                    "Users: " + numberWithCommas(Object.keys(cmd).length) + "/" + numberWithCommas(users.list.length),
                    "Groups: " + acGG.length + "/" + numberWithCommas(groups.list.length),
                    "Block Users: " + (users.blocked.length + users.bot.length),
                    "Block Groups: " + groups.blocked.length,
                    "Command Call: " + commandCalls,
                ];
                sendMessage(api, event, stat.join("\n"));
            } else if (testCommand(api, event, query, "sysinfo", event.senderID)) {
                if (isGoingToFast(api, event)) return;
                let avg_load = os.loadavg();
                let rom = await utils.getProjectTotalSize(__dirname + "/");
                let sysinfo = [
                    "CPU: " + os.cpus()[0].model + " x" + os.cpus().length,
                    "CPU Usage: " + utils.getCPULoad() + "%",
                    "OS: " + os.type() + " " + os.arch() + " v" + os.release(),
                    "Node: v" + process.versions.node + " " + os.endianness(),
                    "RAM: " + convertBytes(os.freemem()) + "/" + convertBytes(os.totalmem()),
                    "ROM: " + convertBytes(rom) + "/1 TB",
                    "RSS: " + convertBytes(process.memoryUsage().rss),
                    "Heap: " + convertBytes(process.memoryUsage().heapUsed) + "/" + convertBytes(process.memoryUsage().heapTotal),
                    "External: " + convertBytes(process.memoryUsage().external),
                    "Array Buffers: " + convertBytes(process.memoryUsage().arrayBuffers),
                    "Average Load: " + Math.floor((avg_load[0] + avg_load[1] + avg_load[2]) / 3) + "%",
                ];
                sendMessage(api, event, sysinfo.join("\n"));
            } else if (testCommand(api, event, query, "uptime", event.senderID)) {
                if (isGoingToFast(api, event)) return;
                let uptime = ["Login: " + secondsToTime(process.uptime()), "Server: " + secondsToTime(os.uptime()), "Server Location: " + getCountryOrigin(os.cpus()[0].model)];
                sendMessage(api, event, uptime.join("\n"));
            } else if (testCommand(api, event, query, "test", event.senderID, "root", true)) {
                if (isGoingToFast(api, event)) return;
                sendMessage(api, event, "Test");
            }
        }

        switch (event.type) {
            case "event": {
                if (event.author && event.author == api.getCurrentUserID()) {
                    break;
                }
                utils.log("event_message_type " + event.threadID + " " + event.logMessageType);
                utils.log("event_message_type " + event.threadID + " " + event.logMessageType);
                switch (event.logMessageType) {
                    default: {
                        utils.log("unsupported_event_message_type " + event.threadID + " " + JSON.stringify(event));
                        break;
                    }
                    case "log:user_nickname": {
                        let userID = event.logMessageData.participant_id;
                        if (!accounts.includes(userID) && !users.bot.includes(userID) && !users.blocked.includes(userID)) {
                            let nameA = event.logMessageData.nickname;
                            if (nameA == "") {
                                sendMessage(api, event, "Why not clear everyone's nickname?");
                            } else {
                                sendMessage(api, event, "Hey " + event.logMessageData.nickname + ", how's it going?");
                            }
                        }
                        break;
                    }
                    case "log:thread_color": {
                        sendMessage(api, event, event.logMessageData.theme_emoji);
                        break;
                    }
                    case "log:change_admins": {
                        let isRemove = event.logMessageData.ADMIN_EVENT;
                        api.getUserInfo(event.logMessageData.TARGET_ID, (err, data) => {
                            if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });

                            updateUserData(data, event.logMessageData.TARGET_ID);

                            if (isRemove == "remove_admin") {
                                if (event.logMessageData.TARGET_ID == api.getCurrentUserID()) {
                                    sendMessage(api, event, "Why am I being demoted?");
                                } else {
                                    sendMessage(api, event, "Hey there, " + data[event.logMessageData.TARGET_ID]["firstName"] + ", you're no longer an admin. Take care!");
                                }
                            } else {
                                if (event.logMessageData.TARGET_ID == api.getCurrentUserID()) {
                                    sendMessage(api, event, "Got it. I'll handle things from now on.");
                                    api.getThreadInfo(event.threadID, async (err, gc) => {
                                        if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });

                                        updateGroupData(gc, event.threadID);

                                        let admins = gc.adminIDs;
                                        for (let admin in admins) {
                                            if (!accounts.includes(admins[admin].id)) {
                                                await sleep(3000);
                                                api.setAdminStatus(event.threadID, admins[admin].id, false, (err) => {
                                                    if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    sendMessage(api, event, "Hi " + data[event.logMessageData.TARGET_ID]["firstName"] + ", welcome to the admin team!");
                                }
                            }
                        });
                        break;
                    }
                    case "log:approval_mode": {
                        let isJoinable = event.logMessageData.APPROVAL_MODE;
                        if (isJoinable == 1) {
                            sendMessage(api, event, "Admins enabled member requests.");
                        } else {
                            sendMessage(api, event, "Now anyone can add friends without bothering the admins.");
                        }
                        break;
                    }
                    case "log:pin_messages": {
                        utils.log(event);
                        break;
                    }
                    case "log:unpin_messages": {
                        utils.log(event);
                        break;
                    }
                    case "log:group_link": {
                        let isJoinable = event.logMessageData.joinable_mode;
                        if (isJoinable == 1) {
                            sendMessage(api, event, "Group link access restricted. No new members allowed.");
                        } else {
                            sendMessage(api, event, "Group link is open! Invite your friends.");
                        }
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
                            let gret;
                            if (i > 1) {
                                gret = "Greetings,";
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
                                gret = "Hello, " + names[0][1] + ". How are you?";
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
                    case "log:thread_name": {
                        api.getUserInfo(event.author, (err, data) => {
                            if (err) return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });

                            updateUserData(data, event.author);

                            utils.getProfile(groups, event.threadID, async function (group) {
                                let msgs;
                                if (group.name != null) {
                                    msgs = data[event.author]["firstName"] + " update the group name from `" + group.name + "` to `" + event.logMessageData.name + "`";
                                    group["name"] = event.logMessageData.name;
                                } else {
                                    msgs = data[event.author]["firstName"] + " set the group name to `" + event.logMessageData.name + "`";
                                }
                                let message = {
                                    body: msgs,
                                };
                                sendMessage(api, event, message);
                                utils.log("event_log_thread_name " + group.name + " to " + event.logMessageData.name);
                            });
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
                                    if (settingsThread[event.threadID].leave && !accounts.includes(id) && !users.admin.includes(id) && settings.default.owner != event.senderID && process.env.ROOT != event.senderID) {
                                        api.addUserToGroup(id, event.threadID, (err) => {
                                            if (err) {
                                                if (err.error == 1545052) {
                                                    return sendMessage(api, event, data[id].firstName + " couldn't be added to the group.");
                                                }
                                                return handleError({ stacktrace: err, cuid: api.getCurrentUserID(), e: event });
                                            }
                                        });
                                    } else {}
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

let font = {
    a: "𝖺",
    b: "𝖻",
    c: "𝖼",
    d: "𝖽",
    e: "𝖾",
    f: "𝖿",
    g: "𝗀",
    h: "𝗁",
    i: "𝗂",
    j: "𝗃",
    k: "𝗄",
    l: "𝗅",
    m: "𝗆",
    n: "𝗇",
    o: "𝗈",
    p: "𝗉",
    q: "𝗊",
    r: "𝗋",
    s: "𝗌",
    t: "𝗍",
    u: "𝗎",
    v: "𝗏",
    w: "𝗐",
    x: "𝗑",
    y: "𝗒",
    z: "𝗓",
    A: "𝖠",
    B: "𝖡",
    C: "𝖢",
    D: "𝖣",
    E: "𝖤",
    F: "𝖥",
    G: "𝖦",
    H: "𝖧",
    I: "𝖨",
    J: "𝖩",
    K: "𝖪",
    L: "𝖫",
    M: "𝖬",
    N: "𝖭",
    O: "𝖮",
    P: "𝖯",
    Q: "𝖰",
    R: "𝖱",
    S: "𝖲",
    T: "𝖳",
    U: "𝖴",
    V: "𝖵",
    W: "𝖶",
    X: "𝖷",
    Y: "𝖸",
    Z: "𝖹",
    1: "𝟣",
    2: "𝟤",
    3: "𝟥",
    4: "𝟦",
    5: "𝟧",
    6: "𝟨",
    7: "𝟩",
    8: "𝟪",
    9: "𝟫",
    0: "𝟢",
};

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

            getResponseData("https://deku-rest-api-3ijr.onrender.com/gpt4?prompt=" + data.join(" ") + "&uid=" + event.senderID).then((response) => {
                sendMessage(api, event, response.gpt4);
            }).catch((err) => {
                handleError({ stacktrace: err });
            });
        }
    }

    reaction(api, event, query, input);
}

function containsAny(str, substrings) {
    for (let i in substrings) {
        let substring = substrings[i];
        if (str.indexOf(substring) != -1) {
            return true;
        }
    }
    return false;
}
function reaction(api, event, query, input) {
    if (containsAny(query, happyEE) || input.includes("😂") || input.includes("🤣") || input.includes("😆")) {
        if (query.includes("hahahaha") || query.includes("hahhaha") || query.includes("ahhahahh")) {
            sendMessage(api, event, funD[Math.floor(Math.random() * funD.length)]);
            emo.push(event.messageID);
        }
        reactMessage(api, event, "🤣");
    } else if (containsAny(query, sadEE)) {
        reactMessage(api, event, "😭");
    } else if (containsAny(query, loveEE) || query == "good") {
        reactMessage(api, event, "❤️");
    }
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

function isGoingToFast1(event, list, time) {
    if (list[event.threadID]) {
        if (Math.floor(Date.now() / 1000) < list[event.threadID]) {
            utils.log("going_to_fast " + event.threadID + " " + ((list[event.threadID] - Math.floor(Date.now() / 1000)) % (60 * time)));
            return true;
        }
    }
    list[event.threadID] = Math.floor(Date.now() / 1000) + 60 * time;
    return false;
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

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

async function sendMessageToAll(api, event) {
    api.getThreadList(10, null, ["INBOX"], async (err, list) => {});
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

function autoLeaveGroup(api, event) {
    switch (event.logMessageType) {
        case "log:subscribe":
            if (event.threadID === "6151536474926085" || event.threadID === "528880986455") return;

            const message = {
                body: "Sorry, I'm not available to chat right now. I'll be back soon.",
            };
            api.sendMessage(message, event.threadID, () => {
                setTimeout(() => {
                    api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
                }, 1500);
            });
            break;
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
    let dir = path.join(__dirname, 'log', 'main.log');
    if (!fs.existsSync(dir)) {
        fs.writeFileSync(dir, "", "utf8");
    }
    fs.appendFile(dir, crashLog, (err) => {
        if (err) return utils.log(err)
    });
    crashLog = "";

    if (process.env.DEBUG === "true") return;
    fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(users), "utf8");
    fs.writeFileSync(path.join(__dirname, 'data', 'groups.json'), JSON.stringify(groups), "utf8");
    fs.writeFileSync(path.join(__dirname, 'data', 'accountPreferences.json'), JSON.stringify(settings), "utf8");
    fs.writeFileSync(path.join(__dirname, 'data', 'threadPreferences.json'), JSON.stringify(settingsThread), "utf8");
    fs.writeFileSync(path.join(__dirname, '.env'), envfile.stringifySync(processEnv), "utf8");
}

function task(func, time) {
    return setInterval(func, time);
}

function deleteCacheData(mode) {
    fs.readdir(__dirname + "/cache/", function (err, files) {
        if (err) return handleError({ stacktrace: err });
        if (files.length > 0) {
            for (let fe in files) {
                let file = files[fe];
                if (mode) {
                    unlinkIfExists(__dirname + "/cache/" + file);
                    utils.log("delete_cache " + unlinkIfExists);
                } else {
                    unLink(__dirname + "/cache/" + file);
                }
            }
        }
    });
}

const convertBytes = function (bytes) {
    if (bytes == 0) {
        return "n/a";
    }
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) {
        return bytes + " " + sizesM[i];
    }
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizesM[i];
};

function updateUserData(user, uid) {
    utils.getGroupProfile(users, uid, async function (name) {
        if (name) {
            name["name"] = user[uid].name;

            if (user[uid].firstName != "") {
                name["firstName"] = user[uid].firstName;
            }
            if (user[uid].vanity != "") {
                name["userName"] = user[uid].vanity;
            }
            if (user[uid].gender != "") {
                name["gender"] = user[uid].gender;
            }

            name["updated_date"] = new Date().toISOString();
        }
    });
}

function updateGroupData(gc, gid) {
    utils.getGroupProfile(groups, gid, async function (group) {
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

function getCountryOrigin(model) {
    if (model.includes("Pentium") && model.includes("T4500") && model.includes("2.3GHz")) {
        return "Philippines";
    }
    return "Singapore";
}

function secondsToTime(e) {
    let h = parseInt(
        Math.floor(e / 3600)
            .toString()
            .padStart(2, "0"),
        10
    );
    let m = parseInt(
        Math.floor((e % 3600) / 60)
            .toString()
            .padStart(2, "0"),
        10
    );
    let s = parseInt(
        Math.floor(e % 60)
            .toString()
            .padStart(2, "0"),
        10
    );
    let constructTime = "";
    if (h >= 1) {
        if (h == 1) {
            constructTime += h + " hour ";
        } else {
            constructTime += h + " hours ";
        }
    }
    if (m >= 1) {
        if (m == 1) {
            constructTime += m + " minute ";
        } else {
            constructTime += m + " minutes ";
        }
    }
    if (s >= 1) {
        if (s == 1) {
            constructTime += s + " second";
        } else {
            constructTime += s + " seconds";
        }
    }
    constructTime += ".";
    let test = constructTime.split(" ");
    if (test.length > 5) {
        return constructTime.replaceAll("hour ", "hour, ").replaceAll("hours ", "hours, ").replaceAll("minute ", "minute and ").replaceAll("minutes ", "minutes and ");
    }
    return constructTime.replaceAll("minute ", "minute and ").replaceAll("minutes ", "minutes and ");
}

async function unLink(dir) {
    await sleep(1000 * 120);
    unlinkIfExists(dir);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function unlinkIfExists(dir) {
    if (fs.existsSync(dir)) {
        fs.unlink(dir, (err) => {
            if (err) return utils.log(err);
        });
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

new Server({
    port: 8080,
    path: "/",
    message: "🤙 Don't let your repl go to sleep!",
    debug: true,
});