import {extractFormInformation, parseURL} from "../../../imports.js";

export class chatbotsPage {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        let personalityId = parseURL();
        this.personality = webSkel.space.getPersonality(personalityId);
        this.history = [];
    }
    beforeRender() {
        let stringHTML = "";
        for(let reply of this.history){
            if(reply.role === "user"){
                stringHTML += `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${reply}</div>
                </div>`;
            }else {
                stringHTML += `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${reply}</div>
                </div>`;
            }
        }
      this.conversationHistory = stringHTML;
      // this.emotions =`
      // <div class="emotion">
      //   <div class="emotion-emoticon">&#128525;</div>
      //   <div class="emotion-name">Affection</div>
      // </div>
      // <div class="emotion">
      //   <div class="emotion-emoticon">&#128534;</div>
      //   <div class="emotion-name">Embarrassment</div>
      // </div>
      // `;
    }
    afterRender(){
        this.conversation = this.element.querySelector(".conversation");
        this.emotionsList = this.element.querySelector(".right-sidebar");
    }
    displayMessage(text, role){
        let reply;
        if(role === "user"){
            reply = `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${text}</div>
                </div>`;

        }else {
            reply = `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${text}</div>
                </div>`;
        }
        this.conversation.insertAdjacentHTML("beforeend", reply);
    }

    displayEmotions(currentEmotions){
        this.emotionsList.textContent = "";
        let emotions = "";
        for(let emotion of currentEmotions){
            emotions += `
            <div class="emotion">
             <div class="emotion-emoticon">${emotion.emoji}</div>
             <div class="emotion-name">${emotion.name}</div>
           </div>`;
        }
        this.emotionsList.insertAdjacentHTML("beforeend", emotions);
    }
    summarizeConversation(){

    }
    async sendMessage(_target){
        let formInfo = await extractFormInformation(_target);
        let input = formInfo.data.input;
        formInfo.elements.input.element.value = "";
        this.displayMessage(input, "user");
        let scriptId = webSkel.space.getScriptIdByName("chatbots");
        if(this.history.length > 6){
          this.summarizeConversation();
        }
        let response = await webSkel.getService("LlmsService").callScript(scriptId, formInfo.data.input, this.personality.name, this.personality.description, this.history.toSpliced(0,1));

        this.history.push({role:"user",content:input});
        this.history.push({role:"assistant",content:response.responseJson.reply});
        this.displayMessage(response.responseJson.reply, "assistant");
        this.displayEmotions(response.responseJson.emotions);
    }
}