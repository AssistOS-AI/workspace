import { llmsService, showModal, showActionBox } from "../../../imports.js";

export class llmsPage {
    constructor(element) {
        this.key = "Key";
        this.name = "Name";
        this.url = "Url";
        this.modal = "showAddLLMModal";
        this.button = "Add LLM";
        this.tableRows = "No data loaded";
        this.element = element;
        const llmService = new llmsService();
        this._llmConfigs = llmService.getLLMs();
        if(webSkel.company.settings.llms) {
            this._llmConfigs = webSkel.company.settings.llms;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._llmConfigs = webSkel.company.settings.llms;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._llmConfigs && this._llmConfigs.length > 0) {
            this._llmConfigs.forEach((item) => {
                this.tableRows += `<llm-unit data-name="${item.name}" data-key="${item.key}" data-url="${item.url}" data-primary-key="${item.primaryKey}"></llm-unit>`;
            });
        } else {
            this.tableRows = `<llm-unit data-name="No data loaded"></llm-unit>`;
        }
    }

    async showAddLLMModal(_target) {
        await showModal(document.querySelector("body"), "add-llm-modal", { presenter: "add-llm-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}