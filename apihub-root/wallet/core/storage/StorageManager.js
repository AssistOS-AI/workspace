import spacesStorage from './spacesStorage.js';
import usersStorage from './usersStorage.js';
import applicationsStorage from './applicationsStorage.js';
import flowsStorage from './flowsStorage.js';
import personalitiesStorage from './personalitiesStorage.js';
import documentsStorage from './documentsStorage.js';
export class StorageManager{
    constructor() {
        let storageRegistry = [spacesStorage, usersStorage, applicationsStorage, flowsStorage, personalitiesStorage, documentsStorage];
        let mergedFunctions = Object.assign({}, ...storageRegistry);
        Object.assign(this, mergedFunctions);
    }
}