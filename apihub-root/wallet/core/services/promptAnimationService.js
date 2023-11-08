import {showModal, closeModal} from "../../imports.js"
export class PromptAnimationService {

    constructor() {
        this.delay = 20;
    }

    async displayThink(prompt){
        if(prompt.length > 500){
            prompt = prompt.substring(0, 500);
            prompt+= "...";
        }
        await showModal(document.querySelector("body"),"prompt-animation");
        return this.animateThink(document.querySelector("prompt-animation"), prompt);
    }
    animateThink(element,prompt) {
        return new Promise((resolve, reject)=>{
            let visible = true;
            let con = element.querySelector("#console");
            let letterCount = 1;
            let x = 1;
            let waiting = false;
            let target = element.querySelector(".animation-space");
            let intervalId = setInterval(async () => {
                if (letterCount === 0 && waiting === false) {
                    waiting = true;
                    target.innerHTML = prompt.substring(0, letterCount);
                    setTimeout(() => {
                        let usedWord = prompt.shift();
                        prompt.push(usedWord);
                        letterCount += x;
                        waiting = false;
                    }, this.delay);
                } else if(letterCount === prompt.length + 1 && waiting === false){
                    const delay = ms => new Promise(res => setTimeout(res, ms));
                    await delay(3000);
                    closeModal(document.querySelector(".console-container"));
                    clearInterval(intervalId);
                    resolve();
                }else if (waiting === false) {
                    target.innerHTML = prompt.substring(0, letterCount);
                    letterCount += x;
                }
            }, this.delay);
            let underscoreInterval = window.setInterval(async ()=> {
                if(!intervalId){
                    clearInterval(underscoreInterval);
                }
                if (visible === true) {
                    con.className = 'console-underscore hidden'
                    visible = false;
                } else {
                    con.className = 'console-underscore'
                    visible = true;
                }
            }, 400);
        });

    }
}