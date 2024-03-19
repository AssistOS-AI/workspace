export class AddCapabilities {
    static id = "3RJcNTBjDu9w";
    static description = "Adds capabilities to the agent, based on the applications that are installed in the system";
    constructor() {
    }

    start() {
        try {
            let flows = system.space.getAllFlows();
            let agentFlows = flows.filter((flow) =>{
                if(flow.class.parameters){
                    if( flow.class.parameters.length !== 0){
                        return flow;
                    }
                }
            });

            let operations = agentFlows.filter((flow) => flow.class.parameters).map((flow) => ({
                description: flow.class.description,
            }));

            this.prompt = `Here is a list of tasks that a custom GPT assistant can perform in a software application: ${JSON.stringify(operations)}. For each of them, summarize their description in a minimum amount of words. Use uppercase for every first letter of a word. Your response should look like this: {"capabilities":["summary 1", "summary 2", ... , "summary n"]}`;

            this.setDefaultValues();
            this.setIntelligenceLevel(3);
            this.setResponseFormat("json_object");
            this.execute();
        } catch (e) {
            this.fail(e);
        }
    }

    async execute() {
        let agent = system.space.agent;
        let response = await this.request(this.prompt);
        try {
            let obj = JSON.parse(response);
            for (let capability of obj.capabilities) {
                agent.addCapability(capability);
            }
        } catch (e) {
            this.fail(e);
        }
        this.return(response);
    }
}