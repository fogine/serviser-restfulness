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

ajvKeywords(module.exports);
