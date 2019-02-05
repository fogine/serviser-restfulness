
module.exports.expandResourceIds = expandResourceIds;


/**
 * applies for mysql:
 * If you insert multiple rows using a single INSERT statement,
 * LAST_INSERT_ID() returns the value generated for the first inserted row only.
 * The reason for this is to make it possible to reproduce
 * easily the same INSERT statement against some other server.
 * https://github.com/tgriesser/knex/issues/86
 *
 * @param {Array<Int>} ids
 * @param {Integer} count
 * @return {Array<Int>}
 */
function expandResourceIds(ids, count) {
    if (ids.length == 1) {
        for (let i = ids[0]+1, len = ids[0]+count; i < len; i++) {
            ids.push(i);
        }
    }
    return ids;
}
