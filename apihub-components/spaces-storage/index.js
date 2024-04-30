const {
    getFileObjectsMetadata,
    getFileObject,
    addFileObject,
    updateFileObject,
    deleteFileObject,
    getContainerObjectsMetadata,
    getContainerObject,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    deleteEmbeddedObject,
    swapEmbeddedObjects,
    getSpace,
    createSpace,
    addCollaboratorToSpace,
    loadFlows,
    getFlow,
    updateFlow,
    deleteFlow,
    addFlow,
    getAgent
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function SpaceStorage(server) {
    server.use("/spaces/*", bodyReader);
    server.use("/spaces/*", authentication);

    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);

    server.post("/spaces", createSpace);
    //server.delete("/spaces/:spaceId", deleteSpace);

    server.post("/spaces/collaborators", addCollaboratorToSpace);

    server.get("/spaces/flows/:spaceId", loadFlows);
    server.get("/spaces/flows/:spaceId/:flowName", getFlow);
    server.post("/spaces/flows/:spaceId/:flowName", addFlow);
    server.put("/spaces/flows/:spaceId/:flowName", updateFlow);
    server.delete("/spaces/flows/:spaceId/:flowName", deleteFlow);

    server.get("/spaces/fileObject/:spaceId/:objectType", getFileObjectsMetadata);
    server.get("/spaces/fileObject/:spaceId/:objectType/:objectId", getFileObject);
    server.post("/spaces/fileObject/:spaceId/:objectType", addFileObject);
    server.put("/spaces/fileObject/:spaceId/:objectType/:objectId", updateFileObject);
    server.delete("/spaces/fileObject/:spaceId/:objectType/:objectId", deleteFileObject);

    server.get("/spaces/:spaceId/agents",getAgent)
    server.get("/spaces/:spaceId/agents/:agentId",getAgent)

    server.get("/spaces/containerObject/meta/:spaceId/:objectType", getContainerObjectsMetadata);
    server.get("/spaces/containerObject/:spaceId/:objectId", getContainerObject);
    server.post("/spaces/containerObject/:spaceId/:objectType", addContainerObject);
    server.put("/spaces/containerObject/:spaceId/:objectId", updateContainerObject);
    server.delete("/spaces/containerObject/:spaceId/:objectId", deleteContainerObject);

    server.get("/spaces/embeddedObject/:spaceId/:objectURI", getEmbeddedObject);
    server.post("/spaces/embeddedObject/:spaceId/:objectURI", addEmbeddedObject);
    server.put("/spaces/embeddedObject/:spaceId/:objectURI", updateEmbeddedObject);
    server.delete("/spaces/embeddedObject/:spaceId/:objectURI", deleteEmbeddedObject);
    server.put("/spaces/embeddedObject/swap/:spaceId/:objectURI", swapEmbeddedObjects);

    //server.post("/spaces/:spaceId/secrets", storeSecret);
    server.get("/spaces", getSpace);
    server.get("/spaces/:spaceId", getSpace);
    server.post("/spaces", createSpace);
    server.post("/spaces/collaborators", addCollaboratorToSpace);
    //server.put("/spaces/:spaceId", storeSpace);


}

module.exports = SpaceStorage;