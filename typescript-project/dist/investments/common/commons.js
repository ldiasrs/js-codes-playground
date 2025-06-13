"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = exports.debug = void 0;
const promises_1 = require("fs/promises");
const debug = (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEBUG] ${message}`, ...args);
    }
};
exports.debug = debug;
const writeFile = async (filePath, content) => {
    try {
        await (0, promises_1.writeFile)(filePath, content, 'utf8');
    }
    catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        throw error;
    }
};
exports.writeFile = writeFile;
//# sourceMappingURL=commons.js.map