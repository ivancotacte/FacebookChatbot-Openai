const os = require("os");

let oldCPUTime = 0;
let oldCPUIdle = 0;

module.exports = () => {
    let cpus = os.cpus();
    let totalTime = -oldCPUTime;
    let totalIdle = -oldCPUIdle;
    let i;
    for (i = 0; i < cpus.length; i++) {
        let cpu = cpus[i];
        for (let type in cpu.times) {
            totalTime += cpu.times[type];
            if (type == "idle") {
                totalIdle += cpu.times[type];
            }
        }
    }
    let load = 100 - Math.round((totalIdle / totalTime) * 100);
    oldCPUTime = totalTime;
    oldCPUIdle = totalIdle;
    return load;
}