import { Chapter } from "../../imports.js";

export class documentService {
    constructor() {
    }

    observeDocument(documentId){
        if(webSkel.company.documents.find(document => document.id === documentId))
            webSkel.company.currentDocumentId = documentId;
    }

    getAllDocuments() {
        return webSkel.company.documents || [];
    }

    getDocument(documentId) {
        const document = webSkel.company.documents.find(document => document.id === documentId);
        return document || null;
    }

    getDocumentIndex(documentId) {
        return webSkel.company.documents.findIndex(document => document.id === documentId);
    }

    async addDocument(document) {
        document.id = await webSkel.localStorage.addDocument(document, webSkel.company.id);
        webSkel.company.documents.push(document);
        webSkel.company.notifyObservers();
    }

    async deleteDocument(documentId) {
        const index = webSkel.company.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            webSkel.company.documents.splice(index, 1);
            await webSkel.localStorage.deleteDocument(webSkel.company.id, documentId);
            webSkel.currentDocumentId = null;
            webSkel.company.notifyObservers();
        }
    }

    async updateDocument(document, documentId) {
        const index = webSkel.company.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            webSkel.company.documents[index] = document;
            await webSkel.localStorage.updateDocument(webSkel.company.id, documentId, document);
            webSkel.company.notifyObservers();
        }
    }
    getDocSettings(documentId) {
        const documentSettings = webSkel.company.documents.find(document => document.id === documentId).settings;
        return documentSettings || [];
    }

    async setDocSettings(documentId, settings){
        const documentIndex = webSkel.company.documents.findIndex(document => document.id === documentId);
        webSkel.company.documents[documentIndex].settings = settings;
        await webSkel.localStorage.setDocSettings(documentId, settings);
    }

    createChapter(document, title) {
        document.chapters.push(new Chapter(title, document.chapters.length + 1, []));
    }

    changeChapterOrder(document, chapterSourceId, chapterTargetId) {
        const sourceIndex = document.chapters.findIndex(ch => ch.id === chapterSourceId);
        const targetIndex = document.chapters.findIndex(ch => ch.id === chapterTargetId);
        if (sourceIndex !== -1 && targetIndex !== -1) {
            [document.chapters[sourceIndex], document.chapters[targetIndex]] = [document.chapters[targetIndex], document.chapters[sourceIndex]];
        }
    }

    observeChapter(document, chapterId) {
        document.currentChapterId = chapterId;
    }

    setCurrentChapter(document, chapterId) {
        document.currentChapterId = chapterId;
    }

    updateDocumentTitle(document, documentTitle) {
        document.title = documentTitle;
    }

    addAlternativeAbstract(document, abstractText){
        document.alternativeAbstracts.push(abstractText);
    }

    updateAbstract(document, abstractText) {
        document.abstract = abstractText;
    }

    getAbstract(document) {
        return document.abstract || null;
    }

    /* left shift(decrement) the ids to the right of the deleted chapter? */
    deleteChapter(document, chapterId) {
        const index = document.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            document.chapters.splice(index, 1);
        }
    }

    deleteParagraph(document, chapterId) {
        const index = document.chapters.findIndex(chapter => chapter.id === chapterId);
        if (index !== -1) {
            document.chapters.splice(index, 1);
        }
    }

    getChapter(documentId, chapterId) {
        return this.getDocument(documentId).chapters.find(chapter => chapter.id === chapterId);
    }
    getChapterIndex(documentId, chapterId) {
        return this.getDocument(documentId).chapters.findIndex(chapter => chapter.id === chapterId);
    }

    getParagraphIndex(document, chapterIndex, paragraphId) {
        return document.chapters[chapterIndex].paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
    }

    getCurrentChapter(document) {
        return document.chapters.find(chapter => chapter.id === document.currentChapterId);
    }

    async swapChapters(documentId, chapterId1, chapterId2) {
        let document = this.getDocument(documentId);
        if(document) {
            [document.chapters[chapterId1], document.chapters[chapterId2]] = [document.chapters[chapterId2], document.chapters[chapterId1]];
            await webSkel.localStorage.updateDocument(webSkel.company.id, document.id, document);
        }else{
            console.error(`Document with id ${documentId} not found! Unable to swap chapters with ids ${chapterId1} and ${chapterId2}.`);
        }
    }

    async swapParagraphs(document, chapterIndex, paragraphIndex1, paragraphIndex2) {
        [document.chapters[chapterIndex].paragraphs[paragraphIndex1], document.chapters[chapterIndex].paragraphs[paragraphIndex2]] = [document.chapters[chapterIndex].paragraphs[paragraphIndex2], document.chapters[chapterIndex].paragraphs[paragraphIndex1]];
        await webSkel.localStorage.updateDocument(webSkel.company.id, document.id, document);
    }
}