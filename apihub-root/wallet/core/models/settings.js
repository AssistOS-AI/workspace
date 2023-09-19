import { LLM } from "./llm.js";
import { Personality } from "./personality.js";

export class Settings{

    constructor(settingsData){
        this.llms = (settingsData.llms|| []).map(llm => new LLM(llm.name, llm.apiKeys, llm.url, llm.id));
        this.personalities = (settingsData.personalities || []).map(personality => new Personality(personality.name, personality.description,personality.id));
    }
}