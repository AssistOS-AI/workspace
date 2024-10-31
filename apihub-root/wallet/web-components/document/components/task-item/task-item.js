const utilModule = require("assistos").loadModule("util", {});
import {NotificationRouter} from "../../../../imports.js";

export class TaskItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        let id = this.element.getAttribute("data-id");
        let tasksModal = this.element.closest("document-tasks-modal");
        this.tasksModalPresenter = tasksModal.webSkelPresenter;
        this.task = this.tasksModalPresenter.getTask(id);

        this.invalidate(async ()=> {
            this.boundOnTasksUpdate = this.onTasksUpdate.bind(this);
            await NotificationRouter.subscribeToSpace(assistOS.space.id , "id", this.boundOnTasksUpdate);
        })
    }
    onTasksUpdate(status){
        this.status = status;
        this.tasksModalPresenter.updateTaskInList(this.task.id, status);
        this.invalidate();
    }
    beforeRender(){
        this.name = this.task.name;
        this.status = this.task.status;
        this.paragraphItem = document.querySelector(`paragraph-item[data-paragraph-id="${this.task.configs.paragraphId}"]`);
        this.paragraphPresenter = this.paragraphItem.webSkelPresenter;
        this.paragraphText = this.paragraphPresenter.paragraph.text || "...........";
        if(this.paragraphPresenter.paragraph.commands.speech){
            this.agent = this.paragraphPresenter.paragraph.commands.speech.personality;
            this.personalityImageSrc = this.paragraphPresenter.speechPersonalityImageSrc;
        } else {
            this.agent = "none";
            this.personalityImageSrc = "./wallet/assets/images/default-personality.png";
        }
    }
    afterRender(){
        let taskStatus = this.element.querySelector(".task-status");
        if(this.status === "failed"){
            taskStatus.setAttribute("data-local-action", "showTaskFailInfo");
            taskStatus.classList.add("failed-link");
        }
        if(this.status === "completed"){
            taskStatus.classList.add("green");
        }
    }

    scrollDocument(){
        let paragraphId = this.paragraphPresenter.paragraph.id;
        let paragraphIndex = this.paragraphPresenter.chapter.getParagraphIndex(paragraphId);
        if (paragraphIndex === this.paragraphPresenter.chapter.paragraphs.length - 1) {
            return this.paragraphItem.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
        this.paragraphItem.scrollIntoView({behavior: "smooth", block: "center"});
    }
    async showTaskFailInfo(){
        let taskInfo = await utilModule.getTaskRelevantInfo(this.task.id);
        let info= "";
        for(let [key,value] of Object.entries(taskInfo)){
            info += `${key}: ${value}\n`;
        }
        let taskInfoHTML = `<div class="info-pop-up">${info}</div>`;
        let taskAction = this.element.querySelector(".task-status");
        taskAction.insertAdjacentHTML("beforeend", taskInfoHTML);
        document.addEventListener("click", this.removeInfoPopUp.bind(this), {once: true});
    }
    removeInfoPopUp(){
        let taskInfo = this.element.querySelector(".info-pop-up");
        taskInfo.remove();
    }
}