export class DeleteDocument {
    static id = "28c1jVcpcdcT";
    static description = "Deletes a document";

    constructor() {
    }

    async start(documentId) {
        try {
            await system.space.deleteDocument(documentId);
            this.return(documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}