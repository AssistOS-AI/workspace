import {BaseParagraph} from "../image-paragraph/BaseParagraph.js";

const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
const personalityModule = require("assistos").loadModule("personality", {});
const spaceModule = require("assistos").loadModule("space", {});

export class ParagraphItem extends BaseParagraph {
    constructor(element, invalidate) {
        super(element, invalidate);
    }

    async subscribeToParagraphEvents() {
        await utilModule.subscribeToObject(this.paragraph.id, async (type) => {
            if (type === "text") {
                let ttsItem = this.element.querySelector('text-to-speech');
                if (ttsItem) {
                    this.openTTSItem = true;
                }
                this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
                this.hasExternalChanges = true;
                this.invalidate();

            } else if (type === "audio") {
                this.paragraph.audio = await documentModule.getParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id);
            } else if (type === "audioConfig") {
                this.paragraph.audioConfig = await documentModule.getParagraphAudioConfigs(assistOS.space.id, this._document.id, this.paragraph.id);
            }
        });
    }

    beforeRender() {
        this.currentParagraphCommand = utilModule.findCommand(this.paragraph.text);
    }

    afterRender() {
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text;
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (this.openTTSItem) {
            this.showTTSPopup(this.element, "off");
            this.openTTSItem = false;
        }

        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
        }

        if (!this.boundPreventSelectionChange) {
            this.boundPreventSelectionChange = this.preventSelectionChange.bind(this);
        }

    }

    async saveParagraph(paragraph) {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id || this.deleted) {
            return;
        }
        let paragraphText = assistOS.UI.sanitize(paragraph.value);
        if (paragraphText !== this.paragraph.text) {
            if (this.hasExternalChanges) {
                this.hasExternalChanges = false;
                return;
            }
            this.paragraph.text = paragraphText;
            await assistOS.callFlow("UpdateParagraphText", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                paragraphId: this.paragraph.id,
                text: paragraphText
            });
        }
    }


    switchParagraphArrows(mode) {
        let arrows = this.element.querySelector('.paragraph-arrows');
        if (mode === "on") {
            arrows.style.visibility = "visible";
        } else {
            arrows.style.visibility = "hidden";
        }
    }

    highlightParagraph() {
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
    }

    focusOutHandler() {
        this.switchParagraphArrows("off");
        const paragraphText = this.element.querySelector('.paragraph-text').value;
        const command = utilModule.findCommand(paragraphText);

        if (command.action !== "textToSpeech" && this.currentParagraphCommand.action === "textToSpeech") {
            /* was textToSpeech but no longer is textToSpeech or was removed */
            documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, null)
                .then(() => {
                    this.invalidate(async () => {
                        this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
                    });
                });
            return;
        }
        if (command.action === "textToSpeech") {
            const commandDifferences= utilModule.isSameCommand(command, this.currentParagraphCommand);
            if (!commandDifferences.isEqual) {
                /* The command has changed -> we regenerate the audio */
                this.audioGenerating = true;
                this.currentParagraphCommand = command;
                personalityModule.getPersonalityByName(assistOS.space.id, command.paramsObject.personality)
                    .then(personality => {
                        assistOS.callFlow("TextToSpeech", {
                            spaceId: assistOS.space.id,
                            prompt: command.remainingText,
                            voiceId: personality.voiceId,
                            voiceConfigs: {
                                emotion: command.paramsObject.emotion,
                                styleGuidance: command.paramsObject.styleGuidance,
                                voiceGuidance: command.paramsObject.voiceGuidance,
                                temperature: command.paramsObject.temperature
                            },
                            modelName: "PlayHT2.0"
                        })
                            .then(response => {
                                const audioBuffer = response.data;
                                spaceModule.addAudio(assistOS.space.id, audioBuffer)
                                    .then(audioId => {
                                        const audioSrc = `spaces/audio/${assistOS.space.id}/${audioId}`;
                                        documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, {
                                            src: audioSrc,
                                            id: audioId
                                        })
                                            .then(() => {
                                                this.audioGenerating = false;
                                                this.invalidate(async () => {
                                                    this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
                                                });
                                            });
                                    })
                                    .catch(error => {
                                        /* handle error or ignore for now */
                                        this.audioGenerating = false;
                                    });
                            })
                            .catch(error => {
                                /* handle error or ignore for now */
                                this.audioGenerating = false;
                            });
                    })
                    .catch(error => {
                        /* handle error or ignore for now */
                        this.audioGenerating = false;
                    });
            }
        }
    }


    mouseDownAudioIconHandler(paragraphText, audioIcon, event) {
        if (!paragraphText.contains(event.target) && !audioIcon.contains(event.target)) {
            audioIcon.classList.add("hidden");
        }
    }

    selectionChangeHandler(paragraphText, audioIcon, event) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0 && paragraphText.contains(selection.anchorNode)) {
            this.updateIconDisplay(audioIcon);
        } else {
            audioIcon.classList.add("hidden");
        }
    }

    preventSelectionChange(event) {
        event.preventDefault();
    }

    updateIconDisplay(audioIcon, event) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0) {
            audioIcon.classList.remove("hidden");
        } else {
            audioIcon.classList.add("hidden");
        }
    }

    showTTSPopup(_target, mode) {
        if (mode === "off") {
            this.selectionText = this.element.querySelector('.paragraph-text').value;
            let ttsPopup = `<text-to-speech data-presenter= "select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech>`;
            this.element.insertAdjacentHTML('beforeend', ttsPopup);
            let controller = new AbortController();
            document.addEventListener("click", this.hideTTSPopup.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showTTSPopup on");
        }
    }

    hideTTSPopup(controller, arrow, event) {
        if (event.target.closest("text-to-speech") || event.target.tagName === "A") {
            return;
        }
        arrow.setAttribute("data-local-action", "showTTSPopup off");
        let popup = this.element.querySelector("text-to-speech");
        if (popup) {
            popup.remove();
        }
        controller.abort();
    };

    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        if (paragraph.value.trim() === "" && event.key === "Backspace" && !this.deleted) {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                this.documentPresenter.stopTimer(false);
                this.deleted = true;
                await this.deleteParagraph();
            }
        } else {
            await this.documentPresenter.resetTimer();
        }
    }

    async copy(_target) {
        const paragraphText = this.element.querySelector('.paragraph-text')
        navigator.clipboard.writeText(paragraphText.value);
        const dropdownMenu = this.element.querySelector('.dropdown-menu');
        dropdownMenu.remove();
    }

    async copyImage() {
        try {
            const image = document.getElementById('myImage');
            const response = await fetch(image.src);
            const blob = await response.blob();
            const clipboardItem = new ClipboardItem({'image/png': blob});
            await navigator.clipboard.write([clipboardItem]);
            console.log('Image copied to clipboard');
        } catch (err) {
            console.error('Failed to copy image: ', err);
        }
    }

    async playParagraphAudio(_target) {
        let audioSection = this.element.querySelector('.paragraph-audio-section');
        let audio = this.element.querySelector('.paragraph-audio');
        audio.src = this.paragraph.audio.src
        audio.load();
        audio.play();
        audioSection.classList.remove('hidden');
        audioSection.classList.add('flex');
        let controller = new AbortController();
        document.addEventListener("click", this.hideAudioElement.bind(this, controller, audio), {signal: controller.signal});
    }

    async deleteAudio(_target) {
        documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, null);
        this.invalidate(async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
        });
    }

    hideAudioElement(controller, audio, event) {
        if (event.target.closest(".paragraph-audio")) {
            return;
        }
        audio.pause();
        let audioSection = this.element.querySelector('.paragraph-audio-section');
        audioSection.classList.add('hidden');
        audioSection.classList.remove('flex');
        controller.abort();
    };

    async openParagraphDropdown(_target) {
        const generateDropdownMenu = () => {
            let baseDropdownMenuHTML =
                `<div class="dropdown-item" data-local-action="deleteParagraph">Delete</div>
                 <div class="dropdown-item" data-local-action="copy">Copy</div>
                 <div class="dropdown-item" data-local-action="openInsertImageModal">Insert Image</div> 
                 <div class="dropdown-item" data-local-action="showTTSPopup off">Text To Speech</div>`;
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <div class="dropdown-item" data-local-action="moveParagraph up">Move Up</div>
                <div class="dropdown-item" data-local-action="moveParagraph down">Move Down</div>` + baseDropdownMenuHTML;
            }
            if (this.paragraph.audio || this.audioGenerating) {
                if (this.audioGenerating) {
                    baseDropdownMenuHTML += `<div class="dropdown-item" id="play-paragraph-audio-btn">Generating Audio...</div>`;
                } else {
                    baseDropdownMenuHTML += `<div class="dropdown-item" id="play-paragraph-audio-btn" data-local-action="playParagraphAudio">Play Audio</div>`;
                    baseDropdownMenuHTML += ` <div class="dropdown-item" data-local-action="downloadAudio">Download Audio</div>`;
                }
            }
            let dropdownMenuHTML =
                `<div class="dropdown-menu">` +
                baseDropdownMenuHTML +
                `</div>`;

            const dropdownMenu = document.createElement('div');
            dropdownMenu.innerHTML = dropdownMenuHTML;
            return dropdownMenu;
        }

        const dropdownMenu = generateDropdownMenu();
        this.element.appendChild(dropdownMenu);

        const removeDropdown = () => {
            dropdownMenu.remove();
        }

        dropdownMenu.addEventListener('mouseleave', removeDropdown);
        dropdownMenu.focus();
    }

    downloadAudio(_target) {
        const link = document.createElement('a');
        link.href = this.paragraph.audio.src;
        link.download = 'audio.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}