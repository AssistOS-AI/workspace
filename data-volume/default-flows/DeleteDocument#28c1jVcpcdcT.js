export class DeleteDocument {
    static id = "28c1jVcpcdcT";
    static description = "Deletes a document";
    static inputSchema = {
        documentId: "string"
    }
    async start(context) {
        try {
            await system.space.deleteDocument(context.documentId);
            this.return(context.documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}