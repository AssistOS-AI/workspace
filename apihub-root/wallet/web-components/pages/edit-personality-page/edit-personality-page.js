import {extractFormInformation, parseURL} from "../../../imports.js";

export class EditPersonalityPage{
    constructor(element,invalidate) {
        this.personality = webSkel.currentUser.space.getPersonality(parseURL());
        this.element = element;
        this.invalidate=invalidate;
        this.knowledgeArray = [];
        this.invalidate();
    }

    beforeRender(){
       this.personalityName = this.personality.name;
        let string = "";
        for(let fact of this.knowledgeArray){
            string+= `<div class="fact">${fact}</div>`;
        }
        this.filteredKnowledge = string;
    }
    preventRefreshOnEnter(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }

    afterRender(){
        let description = this.element.querySelector("textarea");
        description.value = this.personality.description;
        this.userInput = this.element.querySelector("#search");
        this.userInput.removeEventListener("keypress", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this);
        this.userInput.addEventListener("keypress", this.boundFn);
    }
    async search(_target){
        let form = this.element.querySelector(".search");
        let formInfo = await extractFormInformation(form);
        this.knowledgeArray = JSON.parse(await webSkel.currentUser.space.agent.loadFilteredKnowledge(formInfo.data.search));
        if(this.knowledgeArray.length === 0){
            this.knowledgeArray = ["Nothing found"];
        }
        this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
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
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdatePersonality");
            await webSkel.appServices.callFlow(flowId, personalityData, this.personality.id);
            await this.openPersonalitiesPage();
        }
    }

    async deletePersonality(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeletePersonality");
        await webSkel.appServices.callFlow(flowId, this.personality.id);
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage(){
      await webSkel.changeToDynamicPage("personalities-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/personalities-page`);
    }
}