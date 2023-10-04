import {showActionBox, showModal } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class documentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        documentFactory.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(webSkel.space.documents.length > 0) {
            webSkel.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${document.title}" data-id="${document.id}"></document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", { presenter: "add-document-modal"});
    }
    async editAction(_target) {
        webSkel.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.changeToDynamicPage("document-view-page",`documents/${webSkel.space.currentDocumentId}/document-view-page`, {"document-id": webSkel.space.currentDocumentId});
    }

    async deleteAction(_target){
        await documentFactory.deleteDocument(currentSpaceId, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }
}