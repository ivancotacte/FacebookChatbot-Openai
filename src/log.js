module.exports = (data) => { 
    if (typeof data === "string") {
        let d = data.normalize("NFKC").split(" ");
        if (d[0].includes("_")) {
            let db = d[0];
            let db1 = d[1] + "";
            d.shift();
            if (db1.length > 14 && /^\d+$/.test(parseInt(db1))) {
                d.shift();
                console.log("\x1b[36m[", getCurrentTime(), "]\x1b[0m", "\x1b[40m", db, "\x1b[0m", "\x1b[34m", db1, "\x1b[0m", d.join(" "));
            } else {
                console.log("\x1b[36m[", getCurrentTime(), "]\x1b[0m", "\x1b[40m", db, "\x1b[0m", d.join(" "));
            }
        } else {
            console.log("\x1b[36m[", getCurrentTime(), "]\x1b[0m", d.join(" "));
        }
    } else {
        console.log("\x1b[36m[", getCurrentTime(), "]\x1b[0m", data);
    }
}

function getCurrentTime() {
    let options = {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        },
        formatter = new Intl.DateTimeFormat([], options);
    return formatter.format(new Date());
}