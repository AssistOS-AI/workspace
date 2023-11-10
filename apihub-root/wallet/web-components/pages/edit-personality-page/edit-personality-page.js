import {extractFormInformation, parseURL} from "../../../imports.js";

export class editPersonalityPage{
    constructor(element,invalidate) {
        this.personality = webSkel.space.getPersonality(parseURL());
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender(){
       this.personalityName = this.personality.name;
    }

    afterRender(){
        let description = this.element.querySelector("textarea");
        description.value = this.personality.description;
    }

    triggerInputFileOpen(_target){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
        _target.setAttribute("data-local-action", "triggerInputFileOpen");
    }

    async saveChanges(_target){
        const verifyPhotoSize = (element) => {
            if(element.files.length > 0){
                return element.files[0].size <= 1048576;
            }
            return true;
        };
        const conditions = {"verifyPhotoSize": {fn:verifyPhotoSize, errorMessage:"Image too large! Image max size: 1MB"} };
        let formInfo = await extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            let personalityData={
                name:formInfo.data.name,
                description:formInfo.data.description,
                image: formInfo.data.photo
            }
            await webSkel.space.updatePersonality(personalityData, this.personality.id);
            await this.openPersonalitiesPage();
        }
    }

    async deletePersonality(){
        await webSkel.space.deletePersonality(this.personality.id);
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage(){
      await webSkel.changeToDynamicPage("space-page", "space-page/personalities-page");
    }
}