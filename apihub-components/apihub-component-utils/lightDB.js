const enclave = require("opendsu").loadAPI("enclave");
const crypto = require("../apihub-component-utils/crypto.js");
const eventPublisher = require("../subscribers/eventPublisher");

function loadDatabaseClient(spaceId) {
    return enclave.initialiseLightDBEnclave(spaceId);
}
async function insertRecord(spaceId, tableId, objectId, objectData) {
    const dbClient =  loadDatabaseClient(spaceId);
    return   await $$.promisify(dbClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: objectData});
}
async function updateRecord(spaceId,tableId,objectId,objectData) {
    const dbClient = loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: objectData});
}
async function deleteRecord(spaceId,tableId,objectId) {
    const dbClient= loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
}
async function getRecord(spaceId,tableId,objectId) {
    const dbClient = loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
}
async function getAllRecords(spaceId,objectId) {
    const dbClient = loadDatabaseClient(spaceId);
    return await $$.promisify(dbClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectId);
}

//Container Objects
async function insertObjectRecords(spaceId, tableId, objectId, objectData) {
    let object = {};
    for (let key of Object.keys(objectData)) {
        if (Array.isArray(objectData[key])) {
            if (objectData[key].length > 0) {
                object[key] = [];
                if (typeof objectData[key][0] === "object") {
                    for (let item of objectData[key]) {
                        if (!item.id) {
                            item.id = `${key}_${crypto.generateId()}`;
                        }
                        object[key].push(item.id);
                        await insertObjectRecords(spaceId, tableId, item.id, item);
                    }
                } else {
                    //create a copy of the array
                    object[key] = Array.from(objectData[key]);
                }
            } else {
                object[key] = [];
            }
        } else {
            object[key] = objectData[key];
        }
    }
    await insertRecord(spaceId, tableId, objectId, objectData);
}

async function getContainerObject(spaceId, objectId) {
    function constructObject(recordsArray, objectId) {
        function getRecordDataAndRemove(recordsArray, pk) {
            const index = recordsArray.findIndex(item => item.pk === pk);
            if (index !== -1) {
                const record = recordsArray[index];
                recordsArray.splice(index, 1);
                return record.data;
            } else {
                return {};
            }
        }

        let object = getRecordDataAndRemove(recordsArray, objectId);
        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key])) {
                for (let i = 0; i < object[key].length; i++) {
                    object[key][i] = constructObject(recordsArray, object[key][i]);
                }
            }
        }
        return object;
    }

    try {
        let containerObjectRecords = await getAllRecords(spaceId, objectId);
        if (containerObjectRecords.length === 0) {
            throw (`Object with id: ${objectId} not found`);
        }
        return constructObject(containerObjectRecords, objectId);
    } catch (error) {
        throw error;
    }
}

async function getContainerObjectsMetadata(spaceId, objectType) {
    try {
        let records = await getAllRecords(spaceId, objectType);
        let metadata = [];
        for (let record of records) {
            let metadataRecord = await getRecord(spaceId, record.pk, record.pk);
            let object = metadataRecord.data;
            let metadataObj = {};
            for (let key of object.metadata) {
                metadataObj[key] = object[key];
            }
            metadata.push(metadataObj);
        }
        return metadata;
    } catch (error) {
        throw error;
    }
}

async function addContainerObject(spaceId, objectType, objectData, sessionId) {
    async function addContainerObjectToTable(spaceId, objectType, objectData) {
        let objectId = `${objectType}_${crypto.generateId()}`;
        await insertRecord(spaceId, objectType, objectId, objectId);
        objectData.id = objectId;
        await insertObjectRecords(spaceId, objectId, objectId, objectData);
        return objectId;
    }
    try {
       return  await addContainerObjectToTable(spaceId, objectType, objectData);
    } catch (error) {
        throw error;
    }
}

async function updateContainerObject(spaceId, objectId, objectData) {
    async function deleteContainerObjectTable(spaceId, objectId) {
        let objectType = objectId.split('_')[0];
        await deleteRecord(spaceId, objectType, objectId);
        return objectId;
    }
    async function addContainerObjectToTable(spaceId, objectType, objectData) {
        let objectId = `${objectType}_${crypto.generateId()}`;
        await insertRecord(spaceId, objectType, objectId, objectId);
        objectData.id = objectId;
        await insertObjectRecords(spaceId, objectId, objectId, objectData);
        return objectId;
    }
    try {
        await deleteContainerObjectTable(spaceId, objectId);
        let objectType = objectId.split('_')[0];
        await addContainerObjectToTable(spaceId, objectType, objectData);
        return objectId;
    } catch (error) {
        throw error
    }
}

async function deleteContainerObject(spaceId, objectId, sessionId) {
    async function deleteContainerObjectTable(spaceId, objectId) {
        let objectType = objectId.split('_')[0];
        await deleteRecord(spaceId, objectType, objectId);
        return objectId;
    }
    try {
        await deleteContainerObjectTable(spaceId, objectId);
        return objectId;
    } catch (error) {
        throw error
    }
}

//Embedded Objects
async function insertEmbeddedObjectRecords(spaceId, tableId, objectURI, objectData, isUpdate = false) {
    let segments = objectURI.split("/");
    let pk = segments[0];
    segments = segments.slice(1);
    let record = await getRecord(spaceId, tableId, pk);
    let object = record.data;
    if (segments.length === 1) {
        let objectType = segments[0].split('_')[0];
        if (!object[objectType]) {
            object[objectType] = [];
        }
        if (!isUpdate) {
            //array concatenate
            if (Array.isArray(objectData)) {
                for (let item of objectData) {
                    if (!item.id) {
                        item.id = `${objectType}_${crypto.generateId()}`;
                    }
                    if (item.position) {
                        object[objectType].splice(item.position, 0, item.id);
                        delete item.position;
                    } else {
                        object[objectType].push(item.id);
                    }
                    await insertObjectRecords(spaceId, tableId, item.id, item);
                }
                await updateRecord(spaceId, tableId, pk, object);
                return objectData.map(item => item.id);
            }
            //single object
            if (!objectData.id) {
                objectData.id = `${objectType}_${crypto.generateId()}`;
            }
            if (objectData.position !== undefined) {
                object[objectType].splice(objectData.position, 0, objectData.id);
                delete objectData.position;
            } else {
                object[objectType].push(objectData.id);
            }
            await updateRecord(spaceId, tableId, pk, object);
        }
        await insertObjectRecords(spaceId, tableId, objectData.id, objectData);
        return objectData.id;
    } else {
        objectURI = segments.join("/");
        return await insertEmbeddedObjectRecords(spaceId, tableId, objectURI, objectData);
    }
}

async function getEmbeddedObject(spaceId, objectType, objectURI) {
    function isArrayOfEmbeddedObjectsRefs(object, objectType) {
        if (Array.isArray(object) && object.length !== 0) {
            if (typeof object[0] === "string") {
                if (object[0].includes("_")) {
                    if (object[0].split("_")[0] === objectType || object[0].split("_")[0].length <= 16) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    async function constructArrayOfEmbeddedObjects(spaceId, tableId, embeddedObjectRecord) {
        let array = [];
        for (let id of embeddedObjectRecord) {
            let record = await getRecord(spaceId, tableId, id);
            array.push(record.data);
        }
        return array;
    }

    async function constructEmbeddedObject(spaceId, tableId, record) {
        if (!record) {
            throw new Error(`No records found for this object`);
        }
        let object = record.data;
        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key])) {
                for (let i = 0; i < object[key].length; i++) {
                    let record = await getRecord(spaceId, tableId, object[key][i]);
                    object[key][i] = await constructEmbeddedObject(spaceId, tableId, record);
                }
            }
        }
        return object;
    }

    try {
        let [tableId, objectId, propertyName] = objectURI.split("/");
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        let embeddedObjectRecord = await getRecord(spaceId, tableId, objectId);
        let embeddedObject;
        if (propertyName) {
            if (isArrayOfEmbeddedObjectsRefs(embeddedObjectRecord.data[propertyName], propertyName)) {
                embeddedObject = await constructArrayOfEmbeddedObjects(spaceId, tableId, embeddedObjectRecord.data[propertyName]);
                return embeddedObject;
            } else {
                embeddedObject = embeddedObjectRecord.data[propertyName];
            }
        } else {
            embeddedObject = await constructEmbeddedObject(spaceId, tableId, embeddedObjectRecord);
        }
        return embeddedObject;
    } catch (error) {
        throw error;
    }
}

async function addEmbeddedObject(spaceId, objectType, objectURI, objectData) {
    try {
        let parts = objectURI.split("/");
        let tableId = parts[0];
      return await insertEmbeddedObjectRecords(spaceId, tableId, objectURI, objectData);
    } catch (error) {
        throw error;
    }
}

async function updateEmbeddedObject(spaceId, objectURI, objectData,sessionId) {
    async function deleteEmbeddedObjectDependencies(spaceId, tableId, objectId) {
        let record = await getRecord(spaceId, tableId, objectId);
        let object = record.data;
        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key]) && object[key].length > 0) {
                if (typeof object[key][0] === "string" && object[key][0].includes("_")) {
                    for (let item of object[key]) {
                        await deleteEmbeddedObjectDependencies(spaceId, tableId, item);
                    }
                }
            }
        }
        await deleteRecord(spaceId, tableId, objectId);
    }

    try {
        let segments = objectURI.split("/");
        let [tableId, objectId, propertyName] = segments;
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        if (propertyName) {
            let record = await getRecord(spaceId, tableId, objectId);
            let object = record.data;
            if (Array.isArray(objectData) && objectData.length !== 0) {
                if (typeof objectData[0] === "object") {
                    for (let objectId of object[propertyName]) {
                        await deleteEmbeddedObjectDependencies(spaceId, tableId, objectId);
                    }
                    object[propertyName] = [];
                    for (let item of objectData) {
                        await insertEmbeddedObjectRecords(spaceId, tableId, objectURI, item, true);
                        object[propertyName].push(item.id);
                    }
                    await updateRecord(spaceId, tableId, objectId, object);
                    //eventPublisher.notifyClients(sessionId, objectId, propertyName);
                    return objectId;
                }
            }
            object[propertyName] = objectData;
            await updateRecord(spaceId, tableId, objectId, object);
            if (segments.length === 3 || (segments.length === 2 && !Array.isArray(object[propertyName]))) {
                //eventPublisher.notifyClients(sessionId, objectId, propertyName);
            } else {
              //  eventPublisher.notifyClients(sessionId, objectId);
            }
        } else {
            await deleteEmbeddedObjectDependencies(spaceId, tableId, objectId);
            await insertEmbeddedObjectRecords(spaceId, tableId, objectURI, objectData, true);
            //eventPublisher.notifyClients(sessionId, objectId);
        }
        return objectId;
    } catch (error) {
        throw error
    }
}

async function deleteEmbeddedObject(spaceId, objectURI) {
    async function deleteEmbeddedObjectFromTable(spaceId, tableId, objectURI) {
        async function deleteEmbeddedObjectDependencies(spaceId, tableId, objectId) {
            let record = await getRecord(spaceId, tableId, objectId);
            let object = record.data;
            for (let key of Object.keys(object)) {
                if (Array.isArray(object[key]) && object[key].length > 0) {
                    if (typeof object[key][0] === "string" && object[key][0].includes("_")) {
                        for (let item of object[key]) {
                            await deleteEmbeddedObjectDependencies(spaceId, tableId, item);
                        }
                    }
                }
            }
            await deleteRecord(spaceId, tableId, objectId);
        }

        let segments = objectURI.split("/");
        let pk = segments[0];
        segments = segments.slice(1);
        if (segments.length === 1) {
            let record = await getRecord(spaceId, tableId, pk);
            let object = record.data;
            let objectId = segments[0];
            let objectType = objectId.split('_')[0];
            if (object[objectType]) {
                object[objectType].splice(object[objectType].indexOf(objectId), 1)
                await updateRecord(spaceId, tableId, pk, object);
                await deleteEmbeddedObjectDependencies(spaceId, tableId, objectId);
                return objectId;
            }
        } else {
            objectURI = segments.join("/");
            return await deleteEmbeddedObjectFromTable(spaceId, tableId, objectURI);
        }
    }

    try {
        let parts = objectURI.split("/");
        let tableId = parts[0];
        await deleteEmbeddedObjectFromTable(spaceId, tableId, objectURI);
        return objectURI;
    } catch (error) {
        throw error;
    }
}

async function swapEmbeddedObjects(spaceId, objectURI, embeddedIds, sessionId) {
    try {
        let [embeddedId1, embeddedId2] = Object.values(embeddedIds);
        let parts = objectURI.split("/");
        let [tableId, objectId, propertyName] = parts;
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        let record = await getRecord(spaceId, tableId, objectId);
        let object = record.data;
        let index1 = object[propertyName].indexOf(embeddedId1);
        let index2 = object[propertyName].indexOf(embeddedId2);
        if (index1 === -1 || index2 === -1) {
            throw (`Embedded objects not found in ${objectURI}`);
        }
        object[propertyName][index1] = embeddedId2;
        object[propertyName][index2] = embeddedId1;
        await updateRecord(spaceId, tableId, objectId, object);
        eventPublisher.notifyClients(sessionId, objectId);
        return objectURI;
    } catch (error) {
        throw (error);
    }

}
module.exports = {
    getContainerObject,
    getContainerObjectsMetadata,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    deleteEmbeddedObject,
    swapEmbeddedObjects
}
