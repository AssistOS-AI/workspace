const {
    generateText
} = require("./controller.js");

const bodyReader = require("../apihub-component-middlewares/bodyReader");
const authentication = require("../apihub-component-middlewares/authentication");
const authorization = require("../apihub-component-middlewares/authorization");

function LLMStorage(server) {
    server.use("/apis/v1/spaces/:spaceId/llms/*", bodyReader);
    server.use("/apis/v1/spaces/:spaceId/llms/*", authentication);
    server.use("/apis/v1/spaces/:spaceId/llms/*", authorization);

    server.post("/apis/v1/spaces/:spaceId/llms/images/generate", async (request, response) => {
    });
    server.post("/apis/v1/spaces/:spaceId/llms/videos/generate", async (request, response) => {
    });
    server.post("/apis/v1/spaces/:spaceId/llms/audios/generate", async (request, response) => {
    });
    server.post("/apis/v1/spaces/:spaceId/llms/texts/generate", async (request, response) => {
        await generateText(request, response);
    });

}

module.exports = LLMStorage;