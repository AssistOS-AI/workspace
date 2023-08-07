import AppManager from "./app-manager.js";
import { extractFormInformation, checkValidityFormInfo } from "./utils/form-utils.js";
import { closeModal, showModal } from "./utils/modal-utils.js";
import { getAppUrl } from "./utils/url-utils.js";

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}
const defineComponent = async (componentName, templatePath) => {
    let template = await (await fetch(getAppUrl(templatePath))).text();
    customElements.define(
        componentName,
        class extends HTMLElement {
            constructor() {
                super();
            }

            async connectedCallback() {
                let content=template;
                Array.from(this.attributes).forEach(attr => {
                    let textSanitized=sanitize(attr.nodeValue);
                    content=content.replaceAll(`$$${attr.nodeName}`,textSanitized);
                })
                this.innerHTML = content;
            }
        }
    );
};

const appManager = new AppManager();
window.appManager = appManager;

// Actions that can be used from apihub-components controllers can be defined here

appManager.registerAction("showModal", async (...params) => {
    await showModal(appManager.element, "add-brand-modal", {});
})

appManager.registerAction("closeModal", async (modal,_param) => {
    closeModal(modal);
});

appManager.registerAction("changeTool", async (_target,toolId) => {
    console.log(toolId);
    appManager.currentToolId = toolId;
    appManager.navigateToToolPage();
})

appManager.registerAction("showMore", async (_target, id) => {
    console.log(id);
    appManager.showMore(id);
})

appManager.registerAction("hideMore", async (_target, id) => {
    console.log(id);
    appManager.showMore(id);
})

// document.onclick = (args: any) : void => {
//     var showMoreContent = document.querySelector("div.more-content");
//     for(moreWindow : showMoreContent) {
//         moreWindow.style.display = "none";
//     }
// }

appManager.init();

// Modal components defined here

defineComponent("add-modal", "/components/add-modal/add-modal.html");



defineComponent("tool-card", "/components/tool-card/tool-card.html");