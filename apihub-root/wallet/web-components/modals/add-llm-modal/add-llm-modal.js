import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { LLM } from "../../../imports.js";

export class addLLMModal {
    constructor() {
        if(webSkel.space.settings.llms) {
            this._personalityConfigs = webSkel.space.settings.llms;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.space.settings.llms;
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addLLMSubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        closeModal(_target);
        if(formInfo.isValid) {
            let body = formInfo.data;
            let llm = webSkel.space.updateLLM(body.name, body.key);
            await LLM.storeLLM(currentSpaceId, llm);
            webSkel.space.notifyObservers();
        }
    }
}