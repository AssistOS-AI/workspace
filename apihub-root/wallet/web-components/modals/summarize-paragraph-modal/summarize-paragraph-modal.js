import {
    parseURL,
    closeModal, sanitize
} from "../../../imports.js";

export class summarizeParagraphModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = webSkel.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._paragraph=this._chapter.getParagraph(this.paragraphId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        setTimeout(async()=>{
            let scriptId = webSkel.space.getScriptIdByName("summarize paragraph");
            let result = await webSkel.getService("LlmsService").callScript(scriptId,this._paragraph.toString());
            this.paragraphMainIdea = result.responseString;
            this.invalidate();
        },0)
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }
    async addSelectedIdea(_target) {
        await this._paragraph.setMainIdea(sanitize(this.paragraphMainIdea));
        await documentFactory.updateDocument(webSkel.space.id,this._document);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}