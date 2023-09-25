import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    static createDocument() {
        let openDSU = require("opendsu");
        let crypto = openDSU.loadApi("crypto");
        let documentData = {id: crypto.getRandomSecret(16)};
        return new DocumentModel(documentData);
    }

    static async loadDocument(docId) {
        let documentPath = "documents/" + docId;
        let docJson = await webSkel.storageService.loadObject(documentPath, docJson);
        let documentModel = JSON.parse(docJson);
        return new DocumentModel(documentModel);
    }

    static async saveDocument(documentModel) {
        let documentPath = "documents/" + documentModel.id;
        let docJson = JSON.stringify(documentModel);
        await webSkel.storageService.saveObject(documentPath, docJson);
    }
}