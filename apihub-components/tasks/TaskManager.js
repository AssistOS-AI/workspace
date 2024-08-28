const Task = require('./Task');
const enclave = require("opendsu").loadAPI("enclave");
const fsPromises = require('fs').promises;
const space = require('../spaces-storage/space');
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
class TaskManager {
    constructor() {
        this.tasks = [];
        this.tasksTable = "tasks";
        this.queue = [];
        this.maxRunningTasks = 10;
    }
    async initialize() {
        let spaceMapPath = space.APIs.getSpaceMapPath();
        let spacesMap =  JSON.parse(await fsPromises.readFile(spaceMapPath, 'utf-8'));
        for(let spaceId in spacesMap){
            let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
            let records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, this.tasksTable);
            for(let record of records){
                let task = record.data;
                let taskClass = require(`./${task.name}`);
                let taskInstance = new taskClass(task.securityContext, task.spaceId, task.userId, task.configs);
                taskInstance.id = task.id; //set the original id
                taskInstance.status = task.status; //set the original status
                if(taskInstance.status === STATUS.RUNNING){
                    taskInstance.setStatus(STATUS.CANCELLED);
                }
                this.tasks.push(taskInstance);
                if(taskInstance.status === STATUS.PENDING){
                    this.runTask(taskInstance.id);
                }
            }
        }
    }
    async addTask(task) {
        if (!(task instanceof Task)) {
            throw new Error('object provided is not an instance of Task');
        }
        this.tasks.push(task);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(task.spaceId);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, task.id, {data: task.serialize()});

        task.on(EVENTS.UPDATE, async () => {
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, task.id, {data: task.serialize()});
        });
    }

    cancelTaskAndRemove(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        task.cancel();
    }
    async removeTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if(!task){
            throw new Error('Task not found');
        }
        let spaceId = task.spaceId;
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, taskId);
    }
    getTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        return task;
    }
    serializeTasks(spaceId) {
        return this.tasks.filter(task => task.spaceId === spaceId).map(task => task.serialize());
    }
    getRunningTasks() {
        return this.tasks.filter(task => task.status === STATUS.RUNNING);
    }
    runTask(taskId) {
        let runningTasks = this.getRunningTasks();
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (runningTasks.length >= this.maxRunningTasks) {
            this.queue.push(task);
            task.setStatus(STATUS.PENDING);
        } else {
            task.on(STATUS.COMPLETED, () => {
                this.runNextTask();
            });
            task.run();
        }
    }

    runNextTask() {
        if (this.queue.length > 0 && this.getRunningTasks().length < this.maxRunningTasks) {
            let nextTask = this.queue.shift();
            nextTask.on(STATUS.COMPLETED, () => {
                this.runNextTask();
            });
            nextTask.run();
        }
    }
}

const taskManager = new TaskManager();
(async ()=>{
    await taskManager.initialize();
})();
module.exports = taskManager;