
module.exports.generateKnexSelect = generateKnexSelect;
module.exports.unwrap = unwrap;


/**
 * @param {Array<String>} columns
 * @param {String} table
 * @param {String} [alias] - whether to alias each column like: table.column as table.column
 * @return {Array|Object}
 */
function generateKnexSelect(columns, table, alias) {

    return columns.reduce(function(out, column) {
        let key = table + '.' + column;

        if (alias) {
            out[alias + '.' + column] = key;
        } else {
            out[column] = key;
        }

        return out;
    }, {});
}

/**
 * modifyies source data object
 *
 * @param {Object} data
 * @return {Object}
 */
function unwrap(data) {
    let keys = Object.keys(data);

    for (let i = 0, len = keys.length; i < len; i++) {
        let key = keys[i].split('.');
        if (key.length > 1) {
            if (!data.hasOwnProperty(key[0])) {
                data[key[0]] = {};
            }

            data[key[0]][key[1]] = data[keys[i]];
        }
    }

    return data;
}
