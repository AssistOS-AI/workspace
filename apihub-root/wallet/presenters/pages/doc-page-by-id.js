import { Chapter } from "../../imports.js";

export class docPageById {
    static chapterIdForSidebar;
    constructor() {
        this.docTitle = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        this.button = "Add new document";
        this.id = webSkel.company.currentDocumentId;
        this.documentService = webSkel.initialiseService('documentService');

        if (webSkel.company.documents) {
            this._document = this.documentService.getDocument(this.id);
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._document = this.documentService.getDocument(this.id);
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        if(this._document) {
            this.docTitle = this._document.title;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
            this.chapters = this._document.chapters;
        }
    }

    beforeRender() {
        this.chapterDivs = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this.chapters.length > 0) {
            this.documentService.setCurrentChapter(this._document, this.chapters[0].id);
            let iterator = 0;
            this.chapters.forEach((item) => {
                iterator++;
                this.chapterDivs += `<chapter-item data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-item"></chapter-item>`;
            });
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openChapterTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-chapter-title/${docPageById.chapterIdForSidebar}`);
    }

    openChapterBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/chapter-brainstorming/${docPageById.chapterIdForSidebar}`);
    }

    addChapter() {
        this.chapterDivs += `<chapter-item data-chapter-title="New Chapter" data-chapter-id="${this.chapters.length}" data-presenter="chapter-item"></chapter-item>`;
        this.chapters.push(new Chapter("Edit your title here", this.chapters.length + 1, [{text:"Edit your paragraph here"}]));
        this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    afterRender() {
        let chapterSidebar = document.getElementById("chapter-sidebar");
        if(chapterSidebar) {
            document.addEventListener("click", (event) => {
                chapterSidebar.style.display = "none";
                let selectedChapter = document.getElementById("select-chapter-visualise");
                if(selectedChapter) {
                    document.getElementById("select-chapter-visualise").removeAttribute("id");
                }
            }, true);
        }
    }

    static changeRightSidebar(chapterId) {
        const chapterSubmenuSection = document.getElementById("chapter-sidebar");
        chapterSubmenuSection.style.display = "block";
        docPageById.chapterIdForSidebar = chapterId;
        webSkel.company.currentChapterId = chapterId;
    }
}