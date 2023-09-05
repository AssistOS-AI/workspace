import { Company } from "../../core/company.js";
import { closeModal } from "../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";
import { Document } from "../../core/models/document.js";

export class addNewDocumentModal {
    constructor() {
        if(company.companyData.documents) {
            this._documentConfigs = company.companyData.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = company.companyData.documents;
            this.invalidate();
        }
        company.onChange(this.updateState);
    }
    beforeRender() {

    }
    closeModal(_target) {
        closeModal(_target);
    }

    async addDocumentSubmitForm(_target) {
        let documentTitle= new FormData(getClosestParentElement(_target,'form')).get("documentTitle");
        await company.addDocument(new Document(documentTitle));
        closeModal(_target);
    }

}