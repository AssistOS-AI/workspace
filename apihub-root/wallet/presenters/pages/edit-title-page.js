import { Company } from "../../core/company.js";
import { closeModal, showActionBox, showModal } from "../../../WebSkel/utils/modal-utils.js";

export class editTitlePage {
    constructor() {
        this.title = "Current Title";
        this.id = webSkel.registry.currentDocumentId;
        this.alternativeTitles = "";
        let currentCompany = Company.getInstance();
        this.chapterSidebar = "";
        this.showChaptersInSidebar = 0;
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {
        if(this._documentConfigs) {
            this._doc = this._documentConfigs.find(document => document.id === this.id);
            try {
                this.title = this._doc.name;
                let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
                for(let number = 1; number <= 10; number++) {
                    this.alternativeTitles += `<alternative-title-renderer nr="${number}" title="${suggestedTitle}"></alternative-title-renderer>`;
                }

                if(this._doc.chapters.length > 0) {
                    this.chapters = this._doc.chapters;
                }

                this.chapters.forEach((item) => {
                    this.chapterSidebar += `<div class="submenu-item">Edit ${item.title}</div>`;
                });
            } catch(e) {}
        }
    }

    saveTitle() {
        const updatedTitle = document.querySelector(".document-title").value;
        const documentId = webSkel.registry.currentDocumentId;

        const documentIndex = webSkel.registry.storageData.documents.findIndex(doc => doc.id === documentId);

        if (documentIndex !== -1 && updatedTitle !== webSkel.registry.storageData.documents[documentIndex].name) {
            webSkel.registry.storageData.documents[documentIndex].name=updatedTitle;
            webSkel.registry.updateDocument(documentId, webSkel.registry.storageData.documents[documentIndex]);
            const currentCompany=Company.getInstance();
            currentCompany.companyState.documents[documentIndex].name=updatedTitle;
            currentCompany.notifyObservers();
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

    showEditChapterSubmenu() {
        const chapterSubmenuSection = document.querySelector(".sidebar-submenu");
        const sidebarArrow = document.querySelector(".arrow-sidebar");
        if(this.showChaptersInSidebar === 0) {
            chapterSubmenuSection.style.display = "inherit";
            sidebarArrow.classList.remove('rotate');
            this.showChaptersInSidebar = 1;
        }
        else {
            chapterSubmenuSection.style.display = "none";
            sidebarArrow.classList.toggle('rotate');
            this.showChaptersInSidebar = 0;
        }
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitleModal() {
        await showModal(document.querySelector("body"), "suggest-title-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}