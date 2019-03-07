const Ajv         = require('ajv');
const ajvKeywords = require('ajv-keywords');


module.exports = new Ajv({
    $data: true, //data json references
    allErrors: false,
    verbose: false, //dont include validated data in errors
    //it should fail if other keywords are present
    //along the $ref keywords in the schema
    extendRefs: 'fail',
    //only additional properties with additionalProperties keyword
    //equal to false are removed
    additionalProperties: true,
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
    passContext: true, //pass validation context to custom keyword functions
});

module.exports.addKeyword('$default', {
    modifying: true,
    $data: true,
    valid: true,
    validate: function(schema, data, parentSchema, dataPath, parentData, prop) {
        if (parentData[prop] === 'undefined') {
            parentData[prop] = schema;
        }
    }
});

module.exports.registerCustomKeywords = registerCustomKeywords;

function registerCustomKeywords(ajv) {
    failOnAdditionalPropertiesKeyword(ajv);
}

function failOnAdditionalPropertiesKeyword(ajv) {
    ajv.addKeyword('failOnAdditionalProperties', {
        errors: true,
        validate: function validate(schema, data, parentSchema, dataPath, parentData, prop) {
            validate.errors = [];
            if (typeof data === 'object' && data !== null) {
                const dataProperties = Object.keys(data);

                for (let i = 0, len = dataProperties.length; i < len; i++) {
                    if (!parentSchema.properties.hasOwnProperty(dataProperties[i])) {
                        const err = new Error(`unsupported property ${dataProperties[i]}`);
                        err.keyword = 'failOnAdditionalProperties';
                        validate.errors.push(err);
                        return false;
                    }
                }
            }
            return true;
        }
    });
}

ajvKeywords(module.exports);
