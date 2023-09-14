import { docPageById, getClosestParentElement, Paragraph } from "../../imports.js";

export class chapterItem {
    static docServ;
    static chapterServ;
    constructor(element) {
        this.element = element;
        this.chapterContent = "Chapter's content";
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        chapterItem.docServ = webSkel.initialiseService('documentService');
        chapterItem.chapterServ = webSkel.initialiseService('chapterService');
        webSkel.company.onChange(this.updateState);
        this.documentService = webSkel.initialiseService('documentService');
        this.docId = webSkel.company.currentDocumentId;
        this._document = this.documentService.getDocument(this.docId);
        this.chapter = this.documentService.getChapter(this._document, this.chapterId);
    }

    beforeRender() {
        this.chapterId = parseInt(this.element.getAttribute("data-chapter-id"));
        this.chapter = this.documentService.getChapter(this._document, this.chapterId);
        this.chapterContent = "";
        if(this.chapter.paragraphs) {
            this.chapter.paragraphs.forEach((paragraph) => {
                this.chapterContent += `<paragraph-item data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-item>`;
            });
        }
        document.removeEventListener("click", exitEditMode);

        // else {
        //     this.element.querySelector(".chapter-paragraphs").classList.remove("hidden");
        //     this.element.querySelector(".arrow").classList.remove("rotate");
        // }
    }

    showOrHideChapter(_target) {
        if(this.chapter.visibility === "hide") {
            this.chapter.visibility = "show";
        } else {
            this.chapter.visibility = "hide";
        }
        _target.parentNode.nextElementSibling.firstElementChild.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    async moveUp(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterAbove = currentChapter.previousSibling;
        if(chapterAbove.nodeName === "CHAPTER-ITEM") {
            currentChapter.after(chapterAbove);
            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterAboveNumber = chapterAbove.querySelector(".data-chapter-number").innerText.split(".")[0];

            let chapter1Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(currentChapter.getAttribute('data-chapter-id')));
            let chapter2Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(chapterAbove.getAttribute('data-chapter-id')));
            await this.documentService.swapChapters(this._document, chapter1Index, chapter2Index);

            currentChapter.setAttribute("data-chapter-number", chapterAboveNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterAboveNumber + ".";
            chapterAbove.setAttribute("data-chapter-number", currentChapterNumber);
            chapterAbove.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            let chapterAboveId = chapterAbove.getAttribute("data-chapter-id");
            let chapterAboveIndex = this._document.chapters.findIndex(chp => chp.id === parseInt(chapterAboveId));
            if(this._document.chapters[chapterAboveIndex].visibility === "hide") {
                chapterAbove.querySelector(".chapter-paragraphs").classList.add("hidden");
                chapterAbove.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    async moveDown(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-ITEM") {
            chapterBelow.after(currentChapter);
            let chapter1Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(currentChapter.getAttribute('data-chapter-id')));
            let chapter2Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(chapterBelow.getAttribute('data-chapter-id')));
            await this.documentService.swapChapters(this._document, chapter1Index, chapter2Index);

            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterBelowNumber = chapterBelow.querySelector(".data-chapter-number").innerText.split(".")[0];

            chapterBelow.setAttribute("data-chapter-number", currentChapterNumber);
            chapterBelow.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            currentChapter.setAttribute("data-chapter-number", chapterBelowNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterBelowNumber + ".";

            if(this.chapter.visibility === "hide") {
                this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                this.element.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    changeRightSidebar(_target) {
        let target = getClosestParentElement(_target, ".chapter-item");
        let chapterId = target.getAttribute('data-chapter-id');
        docPageById.changeRightSidebar( chapterId);
        target.setAttribute("id", "select-chapter-visualise");
        webSkel.company.currentChapterId = chapterId;
    }

    afterRender() {
        // FUNCTIA CARE INTRA IN MODUL DE EDITARE
        // this.selectedChapter = this.element.firstElementChild.nextElementSibling.firstElementChild.firstElementChild.nextElementSibling.firstElementChild.nextElementSibling;
        // this.selectedChapter.addEventListener("dblclick", enterEditMode, true);
    }
}

function enterEditMode(event) {
    this.setAttribute("id", "selected-chapter");
    this.setAttribute("contenteditable", "true");
    this.focus();
    event.stopPropagation();
    event.preventDefault();
    document.addEventListener("click", exitEditMode, true);
    document.selectedChapter = this;
}

async function exitEditMode(event) {
    if (this.selectedChapter && this.selectedChapter.getAttribute("contenteditable") === "true" && !this.selectedChapter.contains(event.target)) {
        this.selectedChapter.setAttribute("contenteditable", "false");
        let updatedText = this.selectedChapter.innerText;
        if(updatedText === '\n') {
            updatedText = '';
        }
        const documentId = parseInt(getClosestParentElement(this.selectedChapter, "doc-page-by-id").getAttribute("data-document-id"));
        const documentIndex = chapterItem.docServ.getDocumentIndex(documentId);
        let doc = chapterItem.docServ.getDocument(documentId);
        let chapterId = parseInt(getClosestParentElement(this.selectedChapter, ".chapter-item").getAttribute("data-chapter-id"));
        let chapterIndex = chapterItem.docServ.getChapterIndex(doc, chapterId);
        let newParagraphs = [];
        let lastParagraphStartIndex = 0;
        if (documentIndex !== -1 && updatedText !== this.chapter) {
            for (let i = 0; i < updatedText.length; i++) {
                if (updatedText[i] === '\n' || i === updatedText.length - 1) {
                    let numberOfNewLines = 0;
                    let initialIndex = i;
                    while (updatedText[i] === '\n') {
                        i++;
                        numberOfNewLines++;
                    }
                    numberOfNewLines = Math.floor(numberOfNewLines / 2) + 1;
                    let newLineString = "";
                    for (let j = 0; j < numberOfNewLines; j++) {
                        newLineString += "<br>";
                    }
                    let paragraph;
                    if(i !== updatedText.length - 1) {
                        paragraph = new Paragraph(updatedText.slice(lastParagraphStartIndex, initialIndex), newParagraphs.length + 1);
                        updatedText = updatedText.slice(0, initialIndex) + newLineString + updatedText.slice(i);
                    }
                    else {
                        paragraph = new Paragraph(updatedText.slice(lastParagraphStartIndex, initialIndex + 1), newParagraphs.length + 1);
                    }
                    newParagraphs.push(paragraph);
                    lastParagraphStartIndex = initialIndex + newLineString.length;
                }
            }
            if (updatedText === null || updatedText.trim() === '') {
                await chapterItem.docServ.deleteChapter(doc, chapterId);
                webSkel.company.documents[documentIndex].chapters.splice(chapterIndex, 1);
            } else {
                webSkel.company.documents[documentIndex].chapters[chapterIndex].paragraphs = newParagraphs;
            }
            await chapterItem.docServ.updateDocument(webSkel.company.documents[documentIndex], parseInt(documentId));
        }
    }
}