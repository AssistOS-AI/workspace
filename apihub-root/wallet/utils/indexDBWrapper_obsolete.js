export class IndexDBWrapper_obsolete {
    constructor() {
        if (IndexDBWrapper_obsolete.instance) {
            return IndexDBWrapper_obsolete.instance;
        } else {
            IndexDBWrapper_obsolete.instance = this;
        }
    }
    async openDatabase(dbName, version) {
        return new Promise((resolve, reject) => {
            const connectionRequest = indexedDB.open(dbName, version);

            connectionRequest.onerror = (event) => {
                console.error(`Encountered IndexedDB error: ${event.target.error} while trying to open the database`);
                reject(event.target.error);
            };

            connectionRequest.onsuccess = (event) => {
                resolve(event.target.result);
            };

            connectionRequest.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains("spaces")) {
                    const spaceStore = db.createObjectStore("spaces", {keyPath: "id", autoIncrement: true});
                    spaceStore.createIndex("nameIndex", "name", {unique: true});
                }
                /* Add default space */
                const transaction = event.target.transaction;
                const spaceStore = transaction.objectStore("spaces");

                const getAllRequest = spaceStore.getAll();

                let currentDate = new Date();
                let today = currentDate.toISOString().split('T')[0];

                getAllRequest.onsuccess = (event) => {
                    const existingSpaces = event.target.result;

                    if (existingSpaces.length === 0) {
                        const defaultSpace = {
                            name: `Personal Space`,
                            documents: [
                                {
                                    id: 1,
                                    title: "Onboarding Document",
                                    abstract: "Lorem ipsum dolor sit amet, usu at facilis mandamus periculis. Ut aeterno forensibus nec, mea animal utamur in. In option regione temporibus sea, duo insolens hendrerit ex. Harum deleniti recusabo mea an, duo dicant deseruisse disputationi te, ei mei quot offendit. Eum vero minim virtute ex, ne tale porro vel. Eum te graecis phaedrum corrumpit, melius facilis perfecto qui te, ut eam iusto disputando. Ne lorem consetetur vim.",
                                    chapters: [
                                        {
                                            title: "Chapter 1",
                                            id: 1,
                                            paragraphs: [
                                                {
                                                    text: "Lorem ipsum dolor sit amet, usu eu illud oratio, at populo doming usu, error appareat argumentum sit ei. Epicurei pertinax no eam, te enim lucilius est. Sit erat integre lobortis te. In sit integre graecis intellegam. Aperiam nostrud mediocritatem qui no, te duo nulla noluisse.",
                                                    id: 1
                                                },
                                                {
                                                    text: "Eu quo solum persius persecuti, ei mei hinc iriure voluptaria. Odio definitionem delicatissimi mei te, sed at debet suscipiantur, praesent accusamus consulatu per cu. Soluta posidonium vix ad, ut dolore postea doming vix. Etiam possim periculis at pro, pri case causae expetendis ea.",
                                                    id: 2
                                                }
                                            ]
                                        },
                                        {
                                            title: "Chapter 2",
                                            id: 2,
                                            paragraphs: [
                                                {
                                                    text: "Has ex omnium referrentur. Audire concludaturque no vel, mundi minimum mea ei, gloriatur disputando vel eu. Nec ei graecis placerat. Enim idque gubergren ex per, sea illum inciderint cu. Et regione percipit adolescens vix.",
                                                    id: 1
                                                },
                                                {
                                                    text: "At eos saepe torquatos, pro ullum appellantur eu. Semper iisque eam cu, pri an quando epicuri, cu eum eros minim delenit. Est in docendi omnesque, et his quod habeo nonumes, iudico facilis habemus duo cu. Duo justo vituperata ea, pri facete fastidii praesent cu. Cu cum habemus dissentias, iudico equidem nominati eam in.",
                                                    id: 2
                                                }
                                            ]
                                        },
                                        {
                                            title: "Chapter 3",
                                            id: 3,
                                            paragraphs: [
                                                {
                                                    text: "Ea pro causae bonorum erroribus. Eu est tempor dictas ullamcorper. Et apeirian intellegat vel, in pri percipit scribentur liberavisse. No has sonet detracto albucius, aeque graece minimum mea ut.",
                                                    id: 1
                                                },
                                                {
                                                    text: "Ea elitr laoreet accusata eum. Partem graecis est in, cu est mazim viderer eloquentiam, at harum democritum qui. Facilisi efficiantur sit ad, vim prima debitis et. Novum perpetua cum id, duo eu porro cetero postulant, et eos congue evertitur.",
                                                    id: 2
                                                }
                                            ]
                                        }
                                    ], settings: {llm: null, personality: null},
                                    mainIdeas: [], alternativeAbstracts: [], alternativeTitles: []
                                }],
                            settings: {
                                llms: [{
                                    name: "GPT-3",
                                    apiKeys: [
                                        "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"
                                    ],
                                    url: "https://api.openai.com/v1/chat/completions",
                                    id: 1
                                },
                                    {
                                        name: "GPT-4",
                                        apiKeys: [
                                            ""
                                        ],
                                        url: "",
                                        id: 2
                                    }
                                ], personalities: [{
                                    name: "Personality 1",
                                    description: "This is a personality",
                                    id: 1
                                },
                                    {
                                        name: "Personality 2",
                                        description: "This is another personality",
                                        id: 2
                                    }]
                            },
                            admins: [],
                            announcements: [{
                                id: 1,
                                title: "Welcome to AIAuthor!",
                                text: "Space Personal Space was successfully created. You can now add documents, users and settings to your space.",
                                date: today
                            }],
                            users: [{
                                lastName: "Pinguinescu",
                                firstName: "Pingu",
                                email: "pingu@yahoo.com",
                                phoneNumber: "0722222222"
                            },
                                {
                                    lastName: "Pinguinescu",
                                    firstName: "Tux",
                                    email: "tux_pinguinescu@gmail.com",
                                    phoneNumber: "0733333333"
                                }],
                        };
                        const defaultSpace2 = {
                            name: `Personal Space2`,
                            documents: [{
                                id: 1,
                                title: "Onboarding Document2",
                                abstract: "Lorem ipsum dolor sit amet, usu at facilis mandamus periculis. Ut aeterno forensibus nec, mea animal utamur in. In option regione temporibus sea, duo insolens hendrerit ex. Harum deleniti recusabo mea an, duo dicant deseruisse disputationi te, ei mei quot offendit. Eum vero minim virtute ex, ne tale porro vel. Eum te graecis phaedrum corrumpit, melius facilis perfecto qui te, ut eam iusto disputando. Ne lorem consetetur vim.",
                                chapters: [
                                    {
                                        title: "Chapter 1",
                                        id: 1,
                                        paragraphs: [
                                            {
                                                text: "Lorem ipsum dolor sit amet, usu eu illud oratio, at populo doming usu, error appareat argumentum sit ei. Epicurei pertinax no eam, te enim lucilius est. Sit erat integre lobortis te. In sit integre graecis intellegam. Aperiam nostrud mediocritatem qui no, te duo nulla noluisse.",
                                                id: 1
                                            },
                                            {
                                                text: "Eu quo solum persius persecuti, ei mei hinc iriure voluptaria. Odio definitionem delicatissimi mei te, sed at debet suscipiantur, praesent accusamus consulatu per cu. Soluta posidonium vix ad, ut dolore postea doming vix. Etiam possim periculis at pro, pri case causae expetendis ea.",
                                                id: 2
                                            }
                                        ]
                                    },
                                    {
                                        title: "Chapter 2",
                                        id: 2,
                                        paragraphs: [
                                            {
                                                text: "Has ex omnium referrentur. Audire concludaturque no vel, mundi minimum mea ei, gloriatur disputando vel eu. Nec ei graecis placerat. Enim idque gubergren ex per, sea illum inciderint cu. Et regione percipit adolescens vix.",
                                                id: 1
                                            },
                                            {
                                                text: "At eos saepe torquatos, pro ullum appellantur eu. Semper iisque eam cu, pri an quando epicuri, cu eum eros minim delenit. Est in docendi omnesque, et his quod habeo nonumes, iudico facilis habemus duo cu. Duo justo vituperata ea, pri facete fastidii praesent cu. Cu cum habemus dissentias, iudico equidem nominati eam in.",
                                                id: 2
                                            }
                                        ]
                                    },
                                    {
                                        title: "Chapter 3",
                                        id: 3,
                                        paragraphs: [
                                            {
                                                text: "Ea pro causae bonorum erroribus. Eu est tempor dictas ullamcorper. Et apeirian intellegat vel, in pri percipit scribentur liberavisse. No has sonet detracto albucius, aeque graece minimum mea ut.",
                                                id: 1
                                            },
                                            {
                                                text: "Ea elitr laoreet accusata eum. Partem graecis est in, cu est mazim viderer eloquentiam, at harum democritum qui. Facilisi efficiantur sit ad, vim prima debitis et. Novum perpetua cum id, duo eu porro cetero postulant, et eos congue evertitur.",
                                                id: 2
                                            }
                                        ]
                                    }
                                ], settings: {llm: null, personality: null}
                            }],
                            settings: {
                                llms: [{
                                    name: "GPT-3",
                                    apiKeys: [
                                        "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"
                                    ],
                                    url: "https://api.openai.com/v1/chat/completions",
                                    id: 1
                                },
                                    {
                                        name: "GPT-4",
                                        apiKeys: [
                                            ""
                                        ],
                                        url: "",
                                        id: 2
                                    }
                                ], personalities: [
                                    {
                                        name: "Personality 1",
                                        description: "This is a personality",
                                        id: 1
                                    },
                                    {
                                        name: "Personality 2",
                                        description: "This is another personality",
                                        id: 2
                                    }]
                            },
                            admins: [],
                            announcements: [{
                                id: 1,
                                title: "Welcome to AIAuthor!",
                                text: "Space Personal Space2 was successfully created. You can now add documents, users and settings to your space.",
                                date: today
                            }],
                            users: [],
                        };

                        const addRequest = spaceStore.add(defaultSpace);
                        addRequest.onsuccess = () => {
                            console.log("Default space added.");
                        };

                        addRequest.onerror = (event) => {
                            console.error("Could not add default space:", event.target.error);
                        };

                        const addRequest2 = spaceStore.add(defaultSpace2);

                        addRequest2.onsuccess = () => {
                            console.log("Default space added.");
                        };

                        addRequest2.onerror = (event) => {
                            console.error("Could not add default space:", event.target.error);
                        };
                    }
                };

                getAllRequest.onerror = (event) => {
                    console.error("Error fetching existing spaces:", event.target.error);
                };
            };
        });
    }

    /* add */
    async addRecord(db, storeName, data) {
        if (!db.objectStoreNames.contains(storeName)) {
            throw new Error(`Object store "${storeName}" does not exist.`);
        }

        /* Adding a new Record and let indexedDB auto-assign an id*/
        if (data.id !== undefined) {
            const existingRecord = await this.getRecord(db, storeName, data.id);
            if (existingRecord) {
                return;
            }
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            const addRequest = objectStore.add(data);

            addRequest.onsuccess = () => resolve(addRequest.result);
            addRequest.onerror = event => reject(new Error(`Encountered IndexDB error: ${event.target.error} while adding data to ${storeName}.`));

            transaction.onerror = event => reject(event.target.error);
            transaction.onabort = event => reject(new Error('Transaction was aborted'));
        });
    }

    /* get */
    getRecord(db, storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }
            const transaction = db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(key);
            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };
            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while fetching record with key ${key} from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }
    getTableRecords(db, storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while fetching data from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }
    async getAllRecords(db) {
        return new Promise(async (resolve, reject) => {
            const objectStoreNames = Array.from(db.objectStoreNames);
            let allData = {};
            try {
                for (let storeName of objectStoreNames) {
                    allData[storeName] = await this.getTableRecords(db, storeName);
                }
                resolve(allData);
            } catch (error) {
                console.error(`Encountered IndexDB error: ${error} while fetching all data.`);
                reject(error);
            }
        });
    }

    /* update */
    updateRecord(db, storeName, key, dataObject) {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.put({...dataObject, id: key});
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while updating record with key ${key} in ${storeName}.`);
                reject(event.target.error);
            };
        });
    }

    /* delete */
    deleteRecord(db, storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            let request;
            request = objectStore.delete(key);
            request.onsuccess = () => {
                resolve(`Record with key ${key} successfully deleted from ${storeName}.`);
            };
            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while deleting record with key ${key} from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }
}