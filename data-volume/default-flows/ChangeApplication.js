class IFlow {
    constructor() {
        const schema = this.constructor.flowParametersSchema;
        const metadata = this.constructor.flowMetadata;

        if (!schema) {
            throw new Error("Flow inputParametersValidationSchema is required");
        }
        if (!metadata) {
            throw new Error("Flow metadata is required");
        } else {
            if (!metadata.intent) {
                throw new Error("Flow flowMetadata.intent is required");
            }
            if (!metadata.action) {
                throw new Error("Flow flowMetadata.action is required");
            }
        }
    }

    loadModule(moduleName) {
        return require("assistos").loadModule(moduleName, this.__securityContext);
    }

    validateParameters(flowParameters) {
        const schema = this.constructor.flowParametersSchema;
        for (let key in schema) {
            if (schema[key].required && !flowParameters[key]) {
                throw new Error(`Parameter ${key} is required`);
            }
        }
    }

    genericReject(promiseFnc, error) {
        promiseFnc.reject({
            success: false,
            message: error.message,
            statusCode: error.statusCode || 500
        });
    }

    resolve(promiseFnc, data) {
        promiseFnc.resolve({
            success: true,
            data: data
        });
    }

    reject(promiseFnc, error) {
        promiseFnc.reject({
            success: false,
            message: error.message,
            statusCode: error.statusCode || 500
        });
    }
}

class ChangeApplication extends IFlow {
    static flowMetadata = {
        action: "Changes the current application",
        intent: "Change the current application",
    };

    static flowParametersSchema = {
        pageId: {
            type: "string",
            required: true
        },
        refreshFlag: {
            type: "string",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            if (parameters.refreshFlag === '0') {
                if (parameters.pageId === window.location.hash.slice(1)) {
                    return;
                }
            }

            assistOS.changeSelectedPageFromSidebar(parameters.pageId);

            if (parameters.pageId.startsWith("space")) {
                let page = parameters.pageId.split("/")[1];
                await assistOS.UI.changeToDynamicPage(page, parameters.pageId);
            } else {
                await assistOS.UI.changeToDynamicPage(parameters.pageId, parameters.pageId);
            }

            apis.success(parameters.pageId);
        } catch (e) {
            apis.fail(e);
        }
    }

    async execute(parameters) {
        return new Promise(async (resolve, reject) => {
            const apis = {
                success: (data) => this.resolve({ resolve }, data),
                fail: (error) => this.reject({ reject }, error),
                loadModule: (moduleName) => this.loadModule(moduleName, this.__securityContext)
            };
            try {
                this.validateParameters(parameters);
                await this.userCode(apis, parameters);
            } catch (error) {
                this.genericReject(reject, error);
            }
        });
    }
}

module.exports = ChangeApplication;
