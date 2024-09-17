const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});
export class DocumentTasksModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.newTasksCount = 0;
        this.runningTasks = 0;
        this.documentId = this.element.getAttribute("data-document-id");
        this.loadTasks = async () => {
            let tasks = await documentModule.getDocumentTasks(assistOS.space.id, this.documentId);
            if(this.tasks){
                this.calculateNewTasks(tasks);
            }
            this.tasks = tasks;
            this.runningTasks = 0;
            for(let task of this.tasks){
                if(task.status === "running"){
                    this.runningTasks++;
                }
            }
        };
        this.renderNewTasks = async () => {
            this.loadTasks().then(() => {
                let tasksList = this.element.querySelector(".tasks-list");
                let tasksItems = "";
                for(let task of this.tasks){
                    tasksItems += `<task-item data-id="${task.id}" data-name="${task.name}" data-status=${task.status} data-presenter="task-item"></task-item>`;
                }
                tasksList.innerHTML = tasksItems;
                this.renderBadge();
            });
        };
        assistOS.space.observeChange(this.documentId + "/tasks", this.renderNewTasks);

        this.invalidate(async () => {
            await utilModule.subscribeToObject(this.documentId + "/tasks", async (status) => {
                this.renderNewTasks();
            });
            await this.loadTasks();
        })
    }
    calculateNewTasks(newTasks){
        for(let task of newTasks){
            if(task.status !== "created"){
                continue;
            }
            if(!this.tasks.find(t => t.id === task.id)){
                this.newTasksCount++;
            }
        }
        for(let task of this.tasks){
            if(task.status === "created" && !newTasks.find(t => t.id === task.id)){
                this.newTasksCount--;
            }
        }
    }
    beforeRender(){
        this.modalContent = `<div class="tasks-list"></div>`;
        if(this.tasks.length > 0){
            let tasksList = "";
            for(let task of this.tasks){
                tasksList += `<task-item data-id="${task.id}" data-name="${task.name}" data-status=${task.status} data-presenter="task-item"></task-item>`;
            }
            this.modalContent = `
                <div class="tasks-buttons">
                    <button class="general-button run-all-tasks" data-local-action="runAllTasks">Run all</button>
                    <button class="general-button cancel-all-tasks" data-local-action="cancelAllTasks">Cancel all</button>
                </div>
                <div class="tasks-header">
                    <div class="name-header">Name</div>
                    <div class="status-header">Status</div>
                    <div class="action-header">Info</div>
                </div>
                <div class="tasks-list">
                    ${tasksList}
                </div>`;
        }
    }
    renderBadge(){
        let newTasksBadge = this.element.querySelector(".new-tasks-badge");
        if(newTasksBadge){
            newTasksBadge.remove();
        }
        if(this.newTasksCount > 0){
            let newTasksBadge = `<div class="new-tasks-badge">${this.newTasksCount}</div>`;
            this.element.insertAdjacentHTML("afterbegin", newTasksBadge);
        }
    }
    afterRender(){
        this.renderBadge();
        this.checkRunningTasks();
    }
    async runAllTasks(button){
        this.runningTasks = 0;
        for(let task of this.tasks){
            if(task.status === "created" || task.status === "cancelled"){
                this.runningTasks++;
                utilModule.runTask(task.id);
            }
        }
        if(this.runningTasks > 0){
            button.classList.add("disabled");
        }
    }
    async cancelAllTasks(button){
        for(let task of this.tasks){
            if(task.status === "running"){
                utilModule.cancelTask(task.id);
            }
        }
        if(this.runningTasks > 0){
            button.classList.remove("disabled");
        }
    }
    checkRunningTasks(){
        if(this.runningTasks === 0){
            let runAllButton = this.element.querySelector(".run-all-tasks");
            runAllButton.classList.remove("disabled");
            let cancelAllButton = this.element.querySelector(".cancel-all-tasks");
            cancelAllButton.classList.add("disabled");
        } else {
            let runAllButton = this.element.querySelector(".run-all-tasks");
            runAllButton.classList.add("disabled");
            let cancelAllButton = this.element.querySelector(".cancel-all-tasks");
            cancelAllButton.classList.remove("disabled");
        }
    }
    async afterUnload(){
        await utilModule.unsubscribeFromObject(this.documentId + "/tasks");
    }
    closeModal(){
        assistOS.UI.closeModal(this.element);
    }
    updateTaskInList(taskId, status){
        let task = this.tasks.find(t => t.id === taskId);
        task.status = status;
    }
}
