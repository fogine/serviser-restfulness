const Config = require('serviser-config');

module.exports = Config.createMemoryProvider({
    limit: {
        maximum: 500,
        minimum: 0,
        default: 0
    },
    offset: {
        maximum: Number.MAX_SAFE_INTEGER,
        minimum: 0,
        default: 0
    },
    sort: {
        maxLength: 128
    },
    embed: {
        maxLength: 256
    },
    response: {
        validationKeywordWhiteList: ['type', 'default', 'nullable'],
    },
    filter: {
        validationKeywordWhiteList: ['type', 'minimum', 'maximum',
        'maxLength', 'minLength', 'nullable', 'faker', 'format'],
        maxItems: 10,
        minimum: Number.MIN_SAFE_INTEGER,
        maximum: Number.MAX_SAFE_INTEGER,
        minLength: 0,
        maxLength: 32
    }
});
