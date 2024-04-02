const login = require('./src/index');
const utils = require('./src/utils');
const fs = require('fs');


login({ appState: JSON.parse(fs.readFileSync("session.json", "utf8")) }, (err, api) => {
    if (err) return console.error(err);

    api.setOptions({
        logLevel: "silent",
        forceLogin: true,
        listenEvents: true,
        autoMarkDelivery: true,
        autoMarkRead: true,
        selfListen: false,
        online: true,
        proxy: "http://159.255.188.134:41258",
    });

    api.eventListener(async (err, event) => {
        if (err) return console.error(err);

        switch (event.type) {
            case "message":
            case "message_reply":
                if (event.body === "ping") {
                    api.sendMessage("Pong!", event.threadID);
                }
                break;
            case "event":
                break;
        }
    });
});