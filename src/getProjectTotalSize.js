const fsp = require("fs/promises");
const path = require("path");

module.exports = async (dir) => {
    return await getProjectTotalSize(dir);
}

async function getProjectTotalSize(dir) {
    const files = await fsp.readdir(dir, { withFileTypes: true });

    const paths = files.map(async (file) => {
        const path1 = path.join(dir, file.name);

        if (file.isDirectory()) return await getProjectTotalSize(path1);

        if (file.isFile()) {
            const { size } = await fsp.stat(path1);

            return size;
        }

        return 0;
    });

    return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
}