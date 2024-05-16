class IImageLLM{
    constructor(APIKey,config){
        if(new.target===IImageLLM){
            const error = new Error("Cannot construct Interface instances directly")
            error.statusCode = 500
            throw error
        }
        if(this.getModelName===undefined){
            const error = new Error("Classes extending ITextLLM must implement getModelName method")
            error.statusCode = 500
            throw error
        }
        if(APIKey===undefined){
            const error = new Error("apiKey is required")
            error.statusCode = 400
            throw error
        }
        if(config===undefined){
            const error = new Error("config is required")
            error.statusCode = 400
            throw error
        }
    }
}
module.exports=IImageLLM;