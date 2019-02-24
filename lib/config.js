const Config = require('bi-config');

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
    }
});
