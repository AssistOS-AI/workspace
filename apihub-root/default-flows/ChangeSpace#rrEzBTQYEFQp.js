export class ChangeSpace {
    static id = "rrEzBTQYEFQp";
    static description = "Changes the current space";
    constructor() {

    }

    async start(spaceId) {
        try {
            await system.space.changeSpace(spaceId);
            this.return(spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}