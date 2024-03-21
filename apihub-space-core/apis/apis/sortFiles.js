const fsPromises = require('fs').promises;
const path = require('path');

async function sortFiles(files, directoryPath, criterion = 'filename') {
    let filesAttributes = await Promise.all(files.filter(file => file.isFile()).map(async (file) => {
        const fullPath = path.join(directoryPath, file.name);
        const stats = await fsPromises.stat(fullPath);
        return {
            name: file.name,
            extension: path.extname(file.name).toLowerCase(),
            birthtimeMs: stats.birthtimeMs,
            mtimeMs: stats.mtimeMs,
            ctimeMs: stats.ctimeMs
        };
    }));

    switch (criterion) {
        case 'lastEditDate':
            filesAttributes.sort((a, b) => b.mtimeMs - a.mtimeMs);
            break;
        case 'creationDate':
            filesAttributes.sort((a, b) => a.birthtimeMs - b.birthtimeMs);
            break;
        case 'filename':
            filesAttributes.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'extension':
            filesAttributes.sort((a, b) => a.extension.localeCompare(b.extension) || a.name.localeCompare(b.name));
            break;
        default:
            if (typeof criterion === 'function') {
                filesAttributes.sort(criterion);
            }
            break;
    }

    return filesAttributes.map(file => file.name);
}

module.exports = sortFiles;
