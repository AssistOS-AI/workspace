export class SpaceAddDocumentModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        webSkel.closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await webSkel.extractFormInformation(_target);
        if(formData.isValid) {
            let flowId = webSkel.currentUser.space.getFlowIdByName("AddDocument");
            let docId = await webSkel.appServices.callFlow(flowId, formData.data.documentTitle, formData.data.documentTopic);
            docId.responseString? docId = docId.responseString : docId = docId.responseJson;
            webSkel.closeModal(_target);
            await webSkel.changeToDynamicPage(`space-configs-page`, `${webSkel.currentUser.space.id}/SpaceConfiguration/space-document-view-page/${docId}`);
        }
    }
}