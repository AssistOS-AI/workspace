import { StorageService } from './storageService.js';
/*
spaces is root folder
/{spaceId}/name
/{spaceId}/documents/{documentId}
/{spaceId}/documents/{documentId}/title
/{spaceId}/documents/{documentId}/abstract
/{spaceId}/documents/{documentId}/chapters/{chapterId}
/{spaceId}/documents/{documentId}/chapters/{chapterId}/title
/{spaceId}/documents/{documentId}/chapters/{chapterId}/paragraphs/{paragraphId}
/{spaceId}/documents/{documentId}/settings
/{spaceId}/settings/llms/{llmId}
/{spaceId}/settings/personalities/{personalityId}
/{spaceId}/admins/{adminId}
/{spaceId}/announcements/{announcementId}
/{spaceId}/users/{userId}*/
export class FileSystemStorage extends StorageService{
    constructor(){
        super();
    }

    async loadObject(spaceId, objectType, objectName) {

        const result = await fetch(`/spaces/${spaceId}/${objectType}/${objectName}`,
            {
                method: "GET"
            });
        return result.text();
    }
    async storeObject(spaceId, objectType, objectName, jsonData) {

        const result = await fetch(`/spaces/${spaceId}/${objectType}/${objectName}`,
            {
                method: "PUT",
                body: JSON.stringify(jsonData),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        return result.text();
    }

    async listObjects(spaceId, objectType){

    }

    async loadSpace(spaceId) {

    }

}