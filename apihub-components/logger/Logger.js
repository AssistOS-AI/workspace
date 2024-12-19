const path = require("path");
const fsPromises = require("fs").promises;

const CustomError = require('../apihub-component-utils/CustomError');


const file = require("../apihub-component-utils/file.js")
const crypto = require('../apihub-component-utils/crypto');
const {getSpacePath} = require("../spaces-storage/space.js").APIs;

const LOG_LEVELS = Object.freeze({
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
})

const SubscriptionManager = require("../subscribers/SubscriptionManager");

const envLogLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toUpperCase() : 'INFO';
const LOG_LEVEL = LOG_LEVELS[envLogLevel];

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return {
        year,
        month,
        day
    }
}

function notifyLogSubscribers(spaceId, log) {
    let notificationId = SubscriptionManager.getObjectId(spaceId, "logs", `${log.type}`);
    SubscriptionManager.notifyClients("", notificationId, log);
}

class Logger {
    constructor() {
        this.logQueues = {};
        this.locks = new Map();
    }

    async __ensureLogFolderExists(spaceId) {
        const tasksFolderPath = path.join(getSpacePath(spaceId), 'tasks');
        try {
            await file.createDirectory(tasksFolderPath);
        } catch (error) {
            if (error.statusCode !== 409) {
                throw error;
            }
        }
    }

    async __ensureLogFileExists(spaceId, fileName) {
        await this.__ensureLogFolderExists(spaceId);
        const logFilePath = path.join(getSpacePath(spaceId), 'tasks', fileName);
        try {
            await fsPromises.access(logFilePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fsPromises.writeFile(logFilePath, '');
            } else {
                throw error;
            }
        }
        return logFilePath;
    }

    __getLogFileName(year, month, day) {
        return `app.log-${year}-${month}-${day}.log`;
    }

    __getLogFilePath(spaceId, year, month, day) {
        return path.join(getSpacePath(spaceId), 'logs', this.__getLogFileName(year, month, day));
    }

    async __writeLog(spaceId, logData) {
        const generateLogMessage = (logData) => {
            return `${logData.time} - ${logData.type} - ${logData.id} - ${JSON.stringify(logData.data)}\n`;
        }

        const acquireLock = async (filePath) => {
            while (this.locks.get(filePath)) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            this.locks.set(filePath, true);
        }
        const releaseLock = (filePath) => {
            this.locks.set(filePath, false);
        }

        const currentDate = getCurrentDate();
        const logFilename = this.__getLogFileName(currentDate.year, currentDate.month, currentDate.day);
        await this.__ensureLogFileExists(spaceId, logFilename);

        const taskLogFile = this.__getLogFilePath(spaceId, logFilename);
        await acquireLock(taskLogFile);

        try {
            const logMessage = generateLogMessage(logData);
            await fsPromises.appendFile(taskLogFile, logMessage);
            notifyLogSubscribers(spaceId, logData);
        } catch (error) {
            CustomError.throwServerError(`Failed to write log`);
        } finally {
            releaseLock(taskLogFile);
        }
    }

    async __processLogQueue(spaceId) {
        const {queue} = this.logQueues[spaceId]
        this.logQueues[spaceId].processing = true
        while (queue.length) {
            let log = queue.shift()
            await this.__writeLog(spaceId, log)
        }
        this.logQueues[spaceId].processing = false
    }

    createLog(spaceId, logType, logData) {
        if (!LOG_LEVELS[logType]) {
            CustomError.throwBadRequestError(`Invalid log type: "${logType}"`);
        }
        if (LOG_LEVEL < LOG_LEVELS[logType]) {
            CustomError.throwBadRequestError(`Logging method not allowed. Current log level: ${envLogLevel}`);
        }
        const logId = crypto.generateId();

        const log = {
            id: logId,
            type: logType,
            data: logData,
            time: new Date().toISOString()
        }

        if (!this.logQueues[spaceId]) {
            this.logQueues[spaceId] = {queue: [], processing: false}
        }

        this.logQueues[spaceId].queue.push(log)
        if (!this.logQueues[spaceId].processing) {
            this.__processLogQueue(spaceId)
        }
        return logId;

    }

    getLogs(spaceId, date = null) {

    }

    getLog(spaceId, logId) {

    }


}

const logger = new Logger();

module.exports = logger;