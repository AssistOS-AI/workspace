import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";

export class addPersonalityModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
    }

    triggerInputFileOpen(_target){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
        _target.setAttribute("data-local-action", "triggerInputFileOpen");
    }

    async addPersonalitySubmitForm(_target) {
        const verifyPhotoSize = (element) => {
            return element.files[0].size <= 1048576;
        };
        const conditions = {"verifyPhotoSize": {fn:verifyPhotoSize, errorMessage:"Image too large! Image max size: 1MB"} };
        let formInfo = await extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            let personalityData={
                    name:formInfo.data.name,
                    description:formInfo.data.description,
                    id:webSkel.servicesRegistry.UtilsService.generateId(),
                    image: formInfo.data.photo
            }
            await webSkel.space.addPersonality(personalityData);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());
            closeModal(_target);
        }
    }
}