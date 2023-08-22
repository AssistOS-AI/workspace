import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class llmsPage {
    constructor() {
        this.title = "LLMS management";
        this.key = "KEY";
        this.name = "NAME";
        this.url = "URL";
        this.modal = "showAddLLMModal";
        this.button = "Add LLM";
        this.tableRows = "No data loaded";
        let currentCompany = Company.getInstance();
        setTimeout(async () => {
            this._llmConfigs = await currentCompany.companyState.llms;
            this.invalidate();
        }, 0);
        currentCompany.onChange((companyState) => {
            this._llmConfigs = companyState.llms;
            this.invalidate();
        });
    }

    beforeRender() {
        this.tableRows = "";
        if (this._llmConfigs) {
            this._llmConfigs.forEach((item) => {
                this.tableRows += `<llm-item-renderer data-name="${item.name}" data-key="${item.key}" data-url="${item.url}" data-primary-key="${item.primaryKey}"></llm-item-renderer>`;
            });
        } else {
            this.tableRows = `<div> No Data Currently </div>`;
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "add-llm-modal", {});
        });
    }
}