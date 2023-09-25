import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { closeModal, Space } from "../../../imports.js";
import { DocumentModel } from "../../../core/models/documentModel.js";

export class addSpaceModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = () => this.invalidate();
        webSkel.space.onChange(this.updateState);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    beforeRender() {

    }

    async addSpace(_target){
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            await Space.addSpace(formData.data.name);
        }
    }
}