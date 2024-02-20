const login = require("./fb-chat-api");

login(
  { appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) },
  (err, api) => {
    if (err) return console.error(err);

    api.setOptions({
      logLevel: "silent",
      forceLogin: true,
      listenEvents: true,
      autoMarkDelivery: true,
      autoMarkRead: true,
      selfListen: false,
      online: true,
      proxy: process.env.PROXY,
    });

    api.listenMqtt(async (err, event) => {
      if (err) return console.error(err);

      api.markAsReadAll(() => {});

      switch (event.type) {
        case "message":
        case "message_reply":
            break;
        case "event":
            break;
      }
    });
  },
);
