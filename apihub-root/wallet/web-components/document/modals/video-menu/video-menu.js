import {videoUtils} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
export class VideoMenu{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.paragraphPresenter = documentPresenter.element.querySelector(`paragraph-item[data-paragraph-id="${this.paragraphId}"]`).webSkelPresenter;
        this.videoPresenter = this.paragraphPresenter.videoPresenter;
        this.commandsEditor = this.paragraphPresenter.commandsEditor;
        this.element.classList.add("maintain-focus");
        this.invalidate();
    }
    beforeRender(){

    }
    async afterRender(){
        let viewVideoSection = this.element.querySelector(".view-section");
        let deleteVideoButton = this.element.querySelector(".delete-video");
        let lipSyncCheckbox = this.element.querySelector("#lip-sync");
        if(this.paragraphPresenter.paragraph.commands.video){
            viewVideoSection.classList.remove("hidden");
            deleteVideoButton.classList.remove("hidden");
            await this.initViewVideo();
            this.initInputs();
        }
        lipSyncCheckbox.addEventListener("change", async () => {
            if(lipSyncCheckbox.checked){
                await this.insertLipSync();
            }else{
                await this.commandsEditor.deleteCommand("lipsync");
            }
        });
        let commands = this.paragraphPresenter.paragraph.commands;
        if(!commands.video && !commands.image){
            let warnMessage = `No visual source added`;
            this.showLipSyncWarning(warnMessage);
        }
        if(this.paragraphPresenter.paragraph.commands.lipsync){
            lipSyncCheckbox.checked = true;
        }
        let compileButton = this.element.querySelector(".compile-video");
        let deleteCompileButton = this.element.querySelector(".delete-compile-video");
        let downloadButton = this.element.querySelector(".download-compiled-video");
        if(this.paragraphPresenter.paragraph.commands.compileVideo){
            compileButton.classList.add("hidden");
        } else {
            deleteCompileButton.classList.add("hidden");
            downloadButton.classList.add("hidden");
        }
    }
    showLipSyncWarning(message){
        let warning = `
                <div class="paragraph-warning">
                    <img loading="lazy" src="./wallet/assets/icons/warning.svg" class="video-warning-icon" alt="warn">
                    <div class="warning-text">${message}</div>
                </div>`;
        let lipSyncSection = this.element.querySelector(".lip-sync-section");
        lipSyncSection.insertAdjacentHTML("afterend", warning);
    }
    async initViewVideo(){
        let videoElement = this.element.querySelector("video");
        videoElement.src = await spaceModule.getVideoURL(this.paragraphPresenter.paragraph.commands.video.id);
        videoElement.volume = this.paragraphPresenter.paragraph.commands.video.volume / 100;
        if(!this.boundHandlePlay){
            this.boundHandlePlay = this.handlePlay.bind(this, videoElement);
        }
        if(!this.boundHandleEnd){
            this.boundHandleEnd = this.handleEnd.bind(this, videoElement);
        }
        videoElement.addEventListener("play", this.boundHandlePlay);
        videoElement.addEventListener("timeupdate", this.boundHandleEnd);
    }

    initInputs(){
        let startInput = this.element.querySelector("#start");
        startInput.max = this.paragraphPresenter.paragraph.commands.video.duration;
        this.videoStartTime = this.paragraphPresenter.paragraph.commands.video.start;
        startInput.value = this.videoStartTime;
        if(!this.boundHandleStartInput){
            this.boundHandleStartInput = this.handleStartInput.bind(this, startInput);
        }
        startInput.addEventListener("input", this.boundHandleStartInput);

        let endInput = this.element.querySelector("#end");
        endInput.max = this.paragraphPresenter.paragraph.commands.video.duration;
        this.videoEndTime = this.paragraphPresenter.paragraph.commands.video.end;
        endInput.value = this.videoEndTime;
        if(!this.boundHandleEndInput){
            this.boundHandleEndInput = this.handleEndInput.bind(this, endInput);
        }
        endInput.addEventListener("input", this.boundHandleEndInput);

        let videoElement = this.element.querySelector("video");
        let volumeInput = this.element.querySelector("#volume");
        volumeInput.value = this.paragraphPresenter.paragraph.commands.video.volume;
        volumeInput.addEventListener("input", this.handleVolume.bind(this, volumeInput, videoElement));
    }
    handleVolume(input, videoElement, event){
        videoElement.volume = parseFloat(input.value) / 100;
        this.videoVolume = parseFloat(input.value);
        this.toggleSaveButton();
    }
    handlePlay(videoElement, event){
        let start = this.videoStartTime;
        if (videoElement.currentTime < start) {
            videoElement.currentTime = start;
        }
    }
    handleEnd(videoElement, event){
        if (videoElement.currentTime > this.videoEndTime) {
            videoElement.pause();
            videoElement.currentTime = this.videoStartTime;
        }
    }

    async handleStartInput(input, event){
        this.videoStartTime = parseFloat(input.value);
        this.toggleSaveButton();
    }
    async handleEndInput(input, event){
        this.videoEndTime = parseFloat(input.value);
        this.toggleSaveButton();
    }
    toggleSaveButton(){
        let videoCommand = this.paragraphPresenter.paragraph.commands.video;
        if(this.videoStartTime !== videoCommand.start || this.videoEndTime !== videoCommand.end || this.videoVolume !== videoCommand.volume){
            let button = this.element.querySelector(".save-video-duration");
            button.classList.remove("hidden");
        } else {
            let button = this.element.querySelector(".save-video-duration");
            button.classList.add("hidden");
        }
    }

    async insertVideo(){
        let videoId = await this.commandsEditor.insertAttachmentCommand("video");
        if(videoId){
            this.invalidate();
        }
    }
    async deleteVideo(){
        await this.commandsEditor.deleteCommand("video");
        let commands = this.paragraphPresenter.paragraph.commands;
        if(commands.lipsync){
            if(commands.lipsync.videoId){
                await this.insertVideoSource(commands);
            }
        }
        this.invalidate();
    }
    async insertVideoSource(commands){
        await assistOS.loadifyComponent(this.element, async () => {
            let video = document.createElement("video");
            video.crossOrigin = "anonymous";
            let videoURL = await spaceModule.getVideoURL(commands.lipsync.videoId);
            let thumbnailId = await videoUtils.uploadVideoThumbnail(videoURL, video);
            const duration = parseFloat(video.duration.toFixed(1));
            const width = video.videoWidth;
            const height = video.videoHeight;
            let data = {
                id: commands.lipsync.videoId,
                thumbnailId: thumbnailId,
                width: width,
                height: height,
                duration: duration,
                start: 0,
                end: duration,
                volume: 100
            };
            await this.commandsEditor.insertSimpleCommand("video", data);
        });
    }
    async insertLipSync(targetElement) {
        await this.commandsEditor.insertCommandWithTask("lipsync", {});
    }

    async saveVideoChanges(targetElement){
        let startInput = this.element.querySelector("#start");
        let endInput = this.element.querySelector("#end");
        let volumeInput = this.element.querySelector("#volume");
        this.paragraphPresenter.paragraph.commands.video.start = parseFloat(startInput.value);
        this.paragraphPresenter.paragraph.commands.video.end = parseFloat(endInput.value);
        this.paragraphPresenter.paragraph.commands.video.volume = parseFloat(volumeInput.value);
        await documentModule.updateParagraphCommands(assistOS.space.id, this.paragraphPresenter._document.id, this.paragraphPresenter.paragraph.id, this.paragraphPresenter.paragraph.commands);
        this.paragraphPresenter.checkVideoAndAudioDuration();
        this.videoPresenter.setVideoPreviewDuration();
        targetElement.classList.add("hidden");
    }
    async compileVideo(){
        await this.commandsEditor.insertCommandWithTask("compileVideo", {});
        this.invalidate();
    }
    async downloadCompiledVideo(){
        let commands = this.paragraphPresenter.paragraph.commands;
        let videoId = commands.compileVideo.id;
        let videoURL = await spaceModule.getVideoURL(videoId);
        let response = await fetch(videoURL);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        let blob = await response.blob();
        let videoName = `video_${this.paragraphPresenter.paragraph.id}.mp4`;
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = videoName;
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }
    async deleteCompiledVideo(){
        await this.commandsEditor.deleteCommand("compileVideo");
        this.invalidate();
    }
    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}