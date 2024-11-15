import {executorTimer} from "../../../../imports.js";
import {formatTime} from "../../../../utils/videoUtils.js";
import {NotificationRouter} from "../../../../imports.js";
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
const blackScreen = "./wallet/assets/images/black-screen.png";
import CommandsEditor from "./CommandsEditor.js";
import selectionUtils from "../../pages/document-view-page/selectionUtils.js";
import {CustomAudio} from "../../../../imports.js";
export class ParagraphItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.commandsEditor = new CommandsEditor(this._document.id, this.paragraph, this);
        this.invalidate(this.subscribeToParagraphEvents.bind(this));
    }

    async subscribeToParagraphEvents() {
        this.boundOnParagraphUpdate = this.onParagraphUpdate.bind(this);
        await NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundOnParagraphUpdate);
        this.textClass = "paragraph-text"
        this.boundHandleUserSelection = this.handleUserSelection.bind(this, this.textClass);
        await NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundHandleUserSelection);
        this.boundChangeTaskStatus = this.changeTaskStatus.bind(this);
        for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
            for (let [key, value] of Object.entries(commandDetails)) {
                if (key === "taskId") {
                    NotificationRouter.subscribeToSpace(assistOS.space.id, value, this.boundChangeTaskStatus);
                }
            }
        }
    }

    async beforeRender() {
        this.loadedParagraphText = this.paragraph.text || "";
    }

    async afterRender() {
        this.initVideoElements();
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center"});
        }

        let commands = this.element.querySelector(".paragraph-commands");
        this.errorElement = this.element.querySelector(".error-message");
        commands.innerHTML = await this.commandsEditor.buildCommandsHTML();
        if (commands.innerHTML !== "") {
            commands.style.padding = "5px 10px";
        }
        await this.setupVideoPreview();
        let updateCommands;
        if (this.paragraph.commands.video && !this.paragraph.commands.video.hasOwnProperty("start")) {
            this.paragraph.commands.video.start = 0;
            this.paragraph.commands.video.end = this.paragraph.commands.video.duration;
            updateCommands = true;
        }
        if(this.paragraph.commands.audio && !this.paragraph.commands.audio.hasOwnProperty("volume")){
            this.paragraph.commands.audio.volume = 1;
        }
        if(this.paragraph.commands.video && !this.paragraph.commands.video.hasOwnProperty("volume")){
            this.paragraph.commands.video.volume = 1;
        }
        if(updateCommands){
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
        }
        let selected = this.documentPresenter.selectedParagraphs[this.paragraph.id];
        if(selected){
            for(let selection of selected.users){
                await selectionUtils.setUserIcon(selection.imageId, selection.selectId, this.textClass, this);
            }
            if(selected.lockOwner){
                selectionUtils.lockText(this.textClass, this);
            }
        }
    }

    async onParagraphUpdate(type) {
        if (type === "text") {
            this.paragraph.text = await documentModule.getParagraphText(assistOS.space.id, this._document.id, this.paragraph.id);
            this.hasExternalChanges = true;
            let paragraphText = this.element.querySelector(".paragraph-text");
            paragraphText.innerHTML = this.paragraph.text;

        } else if (type === "commands") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            this.commandsEditor.renderCommands();
        }
    }

    async deleteParagraph() {
        await this.documentPresenter.stopTimer(true);
        let message = "Are you sure you want to delete this paragraph?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(!confirmation){
            return;
        }
        let currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);

        await documentModule.deleteParagraph(assistOS.space.id, this._document.id, this.chapter.id, this.paragraph.id);
        if (this.chapter.paragraphs.length > 0) {
            if (currentParagraphIndex === 0) {
                assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
            } else {
                assistOS.space.currentParagraphId = this.chapter.paragraphs[currentParagraphIndex - 1].id;
            }
        } else {
            assistOS.space.currentParagraphId = null;
        }
        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;
        chapterPresenter.deleteParagraph(this.paragraph.id);
    }

    async moveParagraph(_target, direction) {
        if (this.chapter.paragraphs.length === 1) {
            return;
        }
        await this.documentPresenter.stopTimer(false);
        const currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this.chapter.paragraphs);
        await documentModule.swapParagraphs(assistOS.space.id, this._document.id, this.chapter.id, this.paragraph.id, adjacentParagraphId, direction);
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.swapParagraphs(this.paragraph.id, adjacentParagraphId, direction);
    }

    addParagraph() {
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        let mockEvent = {
            ctrlKey: true,
            key: "Enter",
            target: this.element.querySelector(".paragraph-text-container")
        }
        chapterPresenter.addParagraphOrChapterOnKeyPress(mockEvent);
    }

    async saveParagraph(paragraph) {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id || !this.element.closest("body")) {
            return;
        }
        let paragraphText = assistOS.UI.sanitize(paragraph.value);
        if (paragraphText !== this.paragraph.text) {
            if (this.hasExternalChanges) {
                this.hasExternalChanges = false;
                return;
            }
            this.paragraph.text = paragraphText
            this.textIsDifferentFromAudio = true;
            await documentModule.updateParagraphText(assistOS.space.id, this._document.id, this.paragraph.id, paragraphText);
        }
    }

    switchParagraphToolbar(mode) {
        let toolbar = this.element.querySelector('.paragraph-toolbar');
        if (mode === "on") {
            toolbar.style.display = "flex";
            if (window.cutParagraph) {
                let pasteIcon = this.element.querySelector(".paste-icon");
                pasteIcon.classList.remove("hidden");
            }
        } else {
            toolbar.style.display = "none";
        }
    }

    async enterEditModeCommands() {
        let commandsElement = this.element.querySelector('.paragraph-commands');
        if (commandsElement.tagName === "DIV") {
            await this.commandsEditor.renderEditModeCommands();
            let controller = new AbortController();
            document.addEventListener("click", (event) => {
                if (!event.target.closest(".paragraph-commands")) {
                    this.focusOutHandlerHeader(controller);
                }
            }, {signal: controller.signal});
        }

    }

    async highlightParagraph() {
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.switchParagraphToolbar("on");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused");
        let paragraphContainer = this.element.querySelector('.paragraph-container');
        paragraphContainer.classList.add("highlighted-paragraph");
        this.showUnfinishedTasks();
        this.checkVideoAndAudioDuration();
    }

    showUnfinishedTasks() {
        if (assistOS.space.currentParagraphId !== this.paragraph.id) {
            return;
        }
        let unfinishedTasks = 0;
        for (let commandName of Object.keys(this.paragraph.commands)) {
            if (this.paragraph.commands[commandName].taskId) {
                unfinishedTasks++;
            }
        }
        if (unfinishedTasks > 0) {
            this.showParagraphInfo(`${unfinishedTasks} tasks unfinished`);
        } else {
            this.hideParagraphInfo();
        }
    }

    async getPersonalityImageSrc(personalityName) {
        let personality = this.documentPresenter.personalitiesMetadata.find(personality => personality.name === personalityName);
        let personalityImageId;
        if (personality) {
            personalityImageId = personality.imageId;
        } else {
            personalityImageId = null;
            throw new Error("Personality not found");
        }
        if (personalityImageId) {
            return await spaceModule.getImageURL(personalityImageId);
        }
        return "./wallet/assets/images/default-personality.png"
    }

    async addUITask(taskId) {
        assistOS.space.notifyObservers(this._document.id + "/tasks");
        await NotificationRouter.subscribeToSpace(assistOS.space.id, taskId, this.boundChangeTaskStatus);
        this.documentPresenter.renderNewTasksBadge();
    }

    removeHighlightParagraph() {
        this.switchParagraphToolbar("off");
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.focusOutHandler();
        let paragraphContainer = this.element.querySelector('.paragraph-container');
        paragraphContainer.classList.remove("highlighted-paragraph");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        this.hideParagraphInfo();
        this.hideParagraphWarning();
    }

    async focusOutHandler() {
        if (!this.element.closest("body")) {
            return;
        }
        await assistOS.loadifyComponent(this.element, async () => {
                this.removeHighlightParagraph();
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.classList.remove("focused");
                const cachedText = assistOS.UI.customTrim(assistOS.UI.unsanitize(this.paragraph.text));
                const currentUIText = assistOS.UI.customTrim(paragraphText.value);
                const textChanged = assistOS.UI.normalizeSpaces(cachedText) !== assistOS.UI.normalizeSpaces(currentUIText);
                if (textChanged || this.textIsDifferentFromAudio) {
                    for (let command of Object.keys(this.paragraph.commands)) {
                        await this.commandsEditor.handleCommand(command, "changed");
                    }
                    await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                    await this.saveParagraph(paragraphText);
                }
                this.textIsDifferentFromAudio = false;
                assistOS.space.currentParagraphId = null;
                await selectionUtils.deselectItem(this.paragraph.id, this);
            }
        );
    }

    async focusOutHandlerHeader(eventController) {
        await assistOS.loadifyComponent(this.element, async () => {
            await this.commandsEditor.saveCommands(eventController);
        });
    }

    async changeTaskStatus(taskId, status) {
        if (status === "completed") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            this.invalidate();
            this.showUnfinishedTasks();
        }
    }

    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        await this.documentPresenter.resetTimer();
    }

    async cutParagraph(_target) {
        window.cutParagraph = this.paragraph;
        await this.deleteParagraph();
        delete window.cutParagraph.id;
    }

    async pasteParagraph(_target) {
        window.cutParagraph.id = this.paragraph.id;
        await documentModule.updateParagraph(assistOS.space.id, this._document.id, this.paragraph.id, window.cutParagraph);
        this.invalidate(async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            delete window.cutParagraph;
        });
    }

    menus = {
        "insert-document-element": `
                <div class="insert-document-element">
                    <list-item data-local-action="addParagraph" data-name="Insert Paragraph After" data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="addChapter" data-name="Add Chapter" data-highlight="light-highlight"></list-item>
                </div>`,
        "image-menu": `
                <image-menu class="image-menu" data-presenter="image-menu"></image-menu>`,
        "audio-menu": `
                <audio-menu class="audio-menu" data-presenter="audio-menu"></audio-menu>`,
        "video-menu": `
                <video-menu class="video-menu" data-presenter="video-menu"></video-menu>`,
        "paragraph-comment-menu":`<paragraph-comment-menu class="paragraph-comment-menu" data-presenter="paragraph-comment-modal"></paragraph-comment-menu>`,
        "text-menu": `<text-menu class="text-menu" data-presenter="text-menu"></text-menu>`
    }

    openMenu(targetElement, menuName) {
        let menuOpen = this.element.querySelector(`.toolbar-menu.${menuName}`);
        if (menuOpen) {
            return;
        }

        let menuContent = this.menus[menuName];
        let menu = `<div class="toolbar-menu ${menuName}">${menuContent}</div>`
        targetElement.insertAdjacentHTML('beforeend', menu);
        let controller = new AbortController();
        let boundCloseMenu = this.closeMenu.bind(this, controller, targetElement, menuName);
        document.addEventListener("click", boundCloseMenu, {signal: controller.signal});
        let menuComponent = this.element.querySelector(`.${menuName}`);
        menuComponent.boundCloseMenu = boundCloseMenu;
    }

    closeMenu(controller, targetElement, menuName, event) {
        if (event.target.closest(`.toolbar-menu.${menuName}`) || event.target.closest(".insert-modal")) {
            return;
        }
        let menu = this.element.querySelector(`.toolbar-menu.${menuName}`);
        if (menu) {
            menu.remove();
        }
        controller.abort();
    }

    changeMenuIcon(menuName, html) {
        let menuContainer = this.element.querySelector(`.menu-container.${menuName}`);
        menuContainer.innerHTML = html;
    }

    showControls() {
        let controls = this.element.querySelector(".controls-mask-paragraph");
        controls.style.display = "flex";
    }

    hideControls() {
        let controls = this.element.querySelector(".controls-mask-paragraph");
        controls.style.display = "none";
    }

    switchDisplayMode(targetElement) {
        let currentMode = targetElement.getAttribute("data-mode");
        if (currentMode === "minimized") {
            targetElement.setAttribute("data-mode", "fullscreen");
            this.videoContainer.classList.add("fullscreen-paragraph-video");
            let controls = this.element.querySelector(".controls-mask-paragraph");
            let timer = new executorTimer(() => {
                controls.style.display = "none";
                this.videoContainer.style.cursor = "none";
            }, 3000);
            timer.start();
            let boundHideControlsFullscreen = this.hideControlsFullscreen.bind(this, controls, timer);
            this.videoContainer.addEventListener("mousemove", boundHideControlsFullscreen);
            this.boundRemoveListeners = this.removeListeners.bind(this, timer, boundHideControlsFullscreen);
            targetElement.addEventListener("click", this.boundRemoveListeners);

        } else {
            targetElement.setAttribute("data-mode", "minimized");
            this.videoContainer.classList.remove("fullscreen-paragraph-video");
            targetElement.removeEventListener("click", this.boundRemoveListeners);
        }
    }

    hideControlsFullscreen(controls, timer, event) {
        this.videoContainer.style.cursor = "default";
        controls.style.display = "flex";
        timer.reset();
    }

    removeListeners(timer, boundHideControlsFullscreen, event) {
        timer.stop();
        this.videoContainer.removeEventListener("mousemove", boundHideControlsFullscreen);
    }

    initVideoElements() {
        this.videoContainer = this.element.querySelector('.video-container');
        this.playPauseContainer = this.element.querySelector('.play-pause-container');
        this.playPauseIcon = this.element.querySelector(".play-pause");
        this.videoElement = this.element.querySelector(".video-player");
        this.imgElement = this.element.querySelector(".paragraph-image");
        this.audioElement = this.element.querySelector(".audio-player");
        this.currentTimeElement = this.element.querySelector(".current-time");
        this.chapterAudioElement = this.element.querySelector(".chapter-audio");
        if (!this.boundShowControls) {
            this.boundShowControls = this.showControls.bind(this);
            this.boundHideControls = this.hideControls.bind(this);
        }
        this.videoContainer.addEventListener("mouseover", this.boundShowControls);
        this.videoContainer.addEventListener("mouseout", this.boundHideControls);
    }

    async playPause(targetElement) {
        let nextMode = targetElement.getAttribute("data-next-mode");
        if (nextMode === "play") {
            targetElement.setAttribute("data-next-mode", "pause");
            targetElement.src = "./wallet/assets/icons/pause.svg";
            await this.playVideoPreview();
        }
        if (nextMode === "resume") {
            targetElement.setAttribute("data-next-mode", "pause");
            targetElement.src = "./wallet/assets/icons/pause.svg";
            await this.resumeVideo();
        } else if (nextMode === "pause") {
            targetElement.setAttribute("data-next-mode", "resume");
            targetElement.src = "./wallet/assets/icons/play.svg";
            this.audioElement.pause();
            this.videoElement.pause();
            this.chapterAudioElement.pause();
            if (this.silenceInterval) {
                clearInterval(this.silenceInterval);
                delete this.silenceInterval;
            }
        }
    }

    async resumeVideo() {
        if (this.chapterAudioStartTime > -1) {
            this.chapterAudioElement.play();
        }
        if (this.paragraph.commands.video) {
            if (this.paragraph.commands.audio) {
                this.audioElement.play();
            }
            this.videoElement.play();
        } else if (this.paragraph.commands.audio) {
            this.audioElement.play();
        } else if (this.paragraph.commands.silence) {
            await this.playSilence(this.paragraph.commands.silence.duration);
        } else if (this.paragraph.commands.image) {
            await this.playSilence(1);
        }
    }

    setupMediaPlayerEventListeners(mediaPlayer) {
        // if(this.paragraph.commands.effects){
        //     let effectsCopy = JSON.parse(JSON.stringify(this.paragraph.commands.effects));
        //     effectsCopy.sort((a, b) => a.playAt - b.playAt);
        //     let controller = new AbortController();
        //     mediaPlayer.addEventListener("timeupdate", async () => {
        //         if(effectsCopy.length === 0){
        //             controller.abort();
        //             return;
        //         }
        //         if(mediaPlayer.currentTime >= (effectsCopy[0].playAt - 2) && !effectsCopy[0].audio){
        //             effectsCopy[0].audio = new CustomAudio(effectsCopy[0].start, effectsCopy[0].end);
        //             effectsCopy[0].audio.audio.volume = effectsCopy[0].volume;
        //             effectsCopy[0].audio.audio.src = await spaceModule.getAudioURL(effectsCopy[0].id);
        //         }
        //         if(mediaPlayer.currentTime >= effectsCopy[0].playAt && !effectsCopy[0].audio.audio.isPaused){
        //             effectsCopy[0].audio.audio.addEventListener("ended", () => {
        //                 effectsCopy.shift();
        //             });
        //             await effectsCopy[0].audio.audio.play();
        //         }
        //     }, {signal: controller.signal});
        // }
        let stopTimeUpdateController = new AbortController();
        mediaPlayer.addEventListener("timeupdate", () => {
            this.currentTimeElement.innerHTML = formatTime(mediaPlayer.currentTime);
            if (mediaPlayer.endTime && mediaPlayer.currentTime >= mediaPlayer.endTime) {
                mediaPlayer.pause();
                mediaPlayer.currentTime = mediaPlayer.endTime;
                const endedEvent = new Event('ended');
                mediaPlayer.dispatchEvent(endedEvent);
            }
        }, {signal: stopTimeUpdateController.signal});

        mediaPlayer.addEventListener("ended", () => {
            this.chapterAudioElement.pause();
            setTimeout(async () => {
                stopTimeUpdateController.abort();
                this.playPauseIcon.setAttribute("data-next-mode", "play");
                this.playPauseIcon.src = "./wallet/assets/icons/play.svg";
                this.currentTimeElement.innerHTML = formatTime(0);
                this.videoElement.classList.add("hidden");
                await this.setVideoThumbnail();
                this.videoElement.currentTime = 0;
                this.audioElement.currentTime = 0;
            }, 1000);
        }, {once: true});
    }

    playMediaSynchronously(mediaPlayers) {
        let played = false;
        let readyCount = 0;
        const totalPlayers = mediaPlayers.length;
        if (totalPlayers === 0) {
            this.hideLoaderAttachment();
            return;
        }
        for (let mediaPlayer of mediaPlayers) {
            mediaPlayer.addEventListener("canplaythrough", () => {
                readyCount++;
                if (readyCount === totalPlayers && !played) {
                    played = true;
                    this.hideLoaderAttachment();
                    for (let mediaPlayer of mediaPlayers) {
                        if (mediaPlayer.startTime) {
                            mediaPlayer.currentTime = mediaPlayer.startTime;
                        }
                        mediaPlayer.play();
                    }
                }
            }, {once: true});
        }
    }

    async playMedia(mediaPlayers) {
        this.showLoaderAttachment();
        if (this.chapterAudioStartTime > -1) {
            await this.setChapterAudioTime();
            mediaPlayers.push(this.chapterAudioElement);
            this.playMediaSynchronously(mediaPlayers);
        } else {
            this.playMediaSynchronously(mediaPlayers);
        }
        for (let mediaPlayer of mediaPlayers) {
            let id = mediaPlayer.getAttribute("data-id");
            if (id === "paragraph-video") {
                mediaPlayer.src = await spaceModule.getVideoURL(this.paragraph.commands.video.id);
            } else if (id === "paragraph-audio") {
                mediaPlayer.src = await spaceModule.getAudioURL(this.paragraph.commands.audio.id);
            } else if (id === "chapter-audio") {
                mediaPlayer.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
            }
            mediaPlayer.load();
        }
    }

    async setChapterAudioTime() {
        this.chapterAudioElement.addEventListener("loadedmetadata", () => {
            this.chapterAudioElement.currentTime = this.chapterAudioStartTime;
        });
        this.chapterAudioElement.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
        this.chapterAudioElement.pause();
        this.chapterAudioElement.volume = this.chapter.backgroundSound.volume;
    }

    showLoaderAttachment() {
        if (this.loaderTimeout) {
            return;
        }
        this.loaderTimeout = setTimeout(() => {
            this.playPauseIconSrc = this.playPauseIcon.src;
            this.playPauseNextMode = this.playPauseIcon.getAttribute("data-next-mode");
            this.playPauseContainer.innerHTML = `<div class="loading-icon"><div>`;
        }, 500);
    }

    hideLoaderAttachment() {
        clearTimeout(this.loaderTimeout);
        delete this.loaderTimeout;
        if (this.playPauseNextMode) {
            this.playPauseContainer.innerHTML = `<img data-local-action="playPause" data-next-mode="${this.playPauseNextMode}" class="play-pause pointer" src="${this.playPauseIconSrc}" alt="playPause">`;
            this.playPauseIcon = this.element.querySelector(".play-pause");
            delete this.playPauseNextMode;
            delete this.playPauseIconSrc;
        }
    }

    getChapterAudioStartTime() {
        let totalDuration = 0;
        let paragraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        for (let i = paragraphIndex - 1; i >= 0; i--) {
            let paragraph = this.chapter.paragraphs[i];
            let paragraphVideoDuration = this.getVideoPreviewDuration(paragraph);
            totalDuration += paragraphVideoDuration;
        }
        let chapterAudioDuration = this.chapter.backgroundSound.duration;
        if (this.chapter.backgroundSound.loop) {
            return totalDuration % chapterAudioDuration;
        } else if (chapterAudioDuration >= totalDuration) {
            return totalDuration;
        } else {
            return -1;
        }
    }

    async playVideoPreview() {
        if (this.chapter.backgroundSound) {
            this.chapterAudioStartTime = this.getChapterAudioStartTime();
        }
        if (this.paragraph.commands.video) {
            this.videoElement.classList.remove("hidden");
            this.videoElement.startTime = this.paragraph.commands.video.start;
            this.videoElement.endTime = this.paragraph.commands.video.end;
            this.videoElement.volume = this.paragraph.commands.video.volume;
            if (this.paragraph.commands.audio) {
                this.audioElement.volume = this.paragraph.commands.audio.volume;
                let videoDuration = this.paragraph.commands.video.end - this.paragraph.commands.video.start;
                if (videoDuration >= this.paragraph.commands.audio.duration) {
                    this.setupMediaPlayerEventListeners(this.videoElement);
                } else {
                    this.setupMediaPlayerEventListeners(this.audioElement);
                    this.videoElement.addEventListener("ended", () => {
                        this.videoElement.classList.add("hidden");
                        this.imgElement.src = blackScreen;
                    }, {once: true});
                }
                await this.playMedia([this.videoElement, this.audioElement]);
            } else {
                this.setupMediaPlayerEventListeners(this.videoElement);
                await this.playMedia([this.videoElement]);
            }
        } else if (this.paragraph.commands.audio) {
            this.audioElement.volume = this.paragraph.commands.audio.volume;
            this.setupMediaPlayerEventListeners(this.audioElement);
            await this.playMedia([this.audioElement]);
        } else if (this.paragraph.commands.silence) {
            await this.playSilence(this.paragraph.commands.silence.duration);
        } else if (this.paragraph.commands.image) {
            //play chapter audio if it exists
            await this.playSilence(1);
        }
    }

    async playSilence(silenceDuration) {
        if (!this.silenceElapsedTime) {
            this.silenceElapsedTime = 0;
            if (this.chapterAudioStartTime > -1) {
                await this.setChapterAudioTime();
            }
        }
        await this.playMedia([]);
        this.chapterAudioElement.play();
        this.silenceInterval = setInterval(() => {
            this.silenceElapsedTime += 1;
            this.currentTimeElement.innerHTML = formatTime(this.silenceElapsedTime);
            if (this.silenceElapsedTime === silenceDuration) {
                this.chapterAudioElement.pause();
                setTimeout(() => {
                    clearInterval(this.silenceInterval);
                    delete this.silenceInterval;
                    delete this.silenceElapsedTime;
                    this.playPauseIcon.setAttribute("data-next-mode", "play");
                    this.playPauseIcon.src = "./wallet/assets/icons/play.svg";
                    this.currentTimeElement.innerHTML = formatTime(0);
                }, 1000);
            }
        }, 1000);
    }

    getVideoPreviewDuration(paragraph) {
        if (paragraph.commands.video || paragraph.commands.audio) {
            let audioDuration = paragraph.commands.audio ? paragraph.commands.audio.duration : 0;
            let videoDuration = paragraph.commands.video ? paragraph.commands.video.end - paragraph.commands.video.start : 0;
            return Math.max(audioDuration, videoDuration);
        } else if (paragraph.commands.silence) {
            return paragraph.commands.silence.duration;
        } else if (paragraph.commands.image) {
            return 1;
        }
        return 0;
    }

    async setupVideoPreview() {
        let hasAttachment = this.paragraph.commands.image || this.paragraph.commands.video ||
            this.paragraph.commands.audio || this.paragraph.commands.silence;
        this.currentTime = 0;
        if (hasAttachment) {
            this.videoContainer.style.display = "flex";
            let chapterNumber = this.element.querySelector(".chapter-number");
            let chapterIndex = this._document.getChapterIndex(this.chapter.id);
            chapterNumber.innerHTML = chapterIndex + 1;
            let paragraphNumber = this.element.querySelector(".paragraph-number");
            let paragraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
            paragraphNumber.innerHTML = paragraphIndex + 1;
            this.setVideoPreviewDuration();
        } else {
            this.videoContainer.style.display = "none";
        }
        this.videoElement.classList.add("hidden");
        await this.setVideoThumbnail();
    }

    setVideoPreviewDuration() {
        let videoDurationElement = this.element.querySelector(".video-duration");
        let duration = this.getVideoPreviewDuration(this.paragraph);
        videoDurationElement.innerHTML = formatTime(duration);
    }

    async setVideoThumbnail() {
        let imageSrc = blackScreen;
        if (this.paragraph.commands.video) {
            if (this.paragraph.commands.video.thumbnailId) {
                imageSrc = await spaceModule.getImageURL(this.paragraph.commands.video.thumbnailId);
            }
        }
        if (this.paragraph.commands.image && !this.paragraph.commands.video) {
            imageSrc = await spaceModule.getImageURL(this.paragraph.commands.image.id);
        }
        this.imgElement.src = imageSrc;
    }

    checkVideoAndAudioDuration() {
        if (this.paragraph.commands.video && this.paragraph.commands.audio) {
            let videoDuration = this.paragraph.commands.video.end - this.paragraph.commands.video.start;
            if (this.paragraph.commands.audio.duration > videoDuration) {
                let diff = parseFloat((this.paragraph.commands.audio.duration - videoDuration).toFixed(1));
                this.showParagraphWarning(`Audio is longer than the video by ${diff} seconds`);
            } else if (this.paragraph.commands.audio.duration < videoDuration) {
                let diff = parseFloat((videoDuration - this.paragraph.commands.audio.duration).toFixed(1));
                this.showParagraphWarning(`Video is longer than the audio by ${diff} seconds`, async (event) => {
                    this.paragraph.commands.video.end = this.paragraph.commands.video.start + this.paragraph.commands.audio.duration;
                    await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                    this.checkVideoAndAudioDuration();
                    this.setVideoPreviewDuration();
                });
            } else {
                this.hideParagraphWarning();
            }
        } else {
            this.hideParagraphWarning();
        }
    }

    hideParagraphWarning() {
        let warningElement = this.element.querySelector(".paragraph-warning");
        if (warningElement) {
            warningElement.remove();
        }
    }

    showParagraphWarning(message, fixCb) {
        let warningElement = this.element.querySelector(".paragraph-warning");
        if (warningElement) {
            warningElement.remove();
        }
        let fixHTML = "";
        if (fixCb) {
            fixHTML = `<div class="fix-warning">fix this</div>`;
        }
        let warning = `
                <div class="paragraph-warning">
                    <img loading="lazy" src="./wallet/assets/icons/warning.svg" class="video-warning-icon" alt="warn">
                    <div class="warning-text">${message}</div>
                    ${fixHTML}
                </div>`;
        let paragraphHeader = this.element.querySelector(".header-section");
        paragraphHeader.insertAdjacentHTML('afterbegin', warning);
        if (fixCb) {
            let fixWarning = paragraphHeader.querySelector(".fix-warning");
            fixWarning.addEventListener("click", fixCb.bind(this), {once: true});
        }
    }

    hideParagraphInfo() {
        let tasksInfo = this.element.querySelector(".paragraph-info");
        if (tasksInfo) {
            tasksInfo.remove();
        }
    }

    showParagraphInfo(message) {
        let tasksInfo = this.element.querySelector(".paragraph-info");
        if (tasksInfo) {
            tasksInfo.remove();
        }
        let info = `
                <div class="paragraph-info">
                    <img loading="lazy" src="./wallet/assets/icons/info.svg" class="tasks-warning-icon" alt="info">
                    <div class="info-text">${message}</div>
                </div>`;
        let paragraphHeader = this.element.querySelector(".header-section");
        paragraphHeader.insertAdjacentHTML('beforeend', info);
    }

    async handleUserSelection(itemClass, data){
        if(typeof data === "string"){
            return ;
        }
        if(data.selected){
            await selectionUtils.setUserIcon(data.imageId, data.selectId, itemClass, this);
            if(data.lockOwner &&  data.lockOwner !== this.selectId){
                return selectionUtils.lockText(itemClass, this);
            }
        } else {
            selectionUtils.removeUserIcon(data.selectId, this);
            if(!data.lockOwner){
                selectionUtils.unlockText(itemClass, this);
            }
        }
    }

    async afterUnload(){
        if(this.selectionInterval){
            await selectionUtils.deselectItem(this.paragraph.id, this);
        }
    }
}
