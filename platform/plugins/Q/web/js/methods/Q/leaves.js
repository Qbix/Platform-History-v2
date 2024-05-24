Q.exports(function (Q) {
    /**
     * Q plugin's front end code
     *
     * @module Q
     * @class Q
     */

    /**
     * Traverse all the leaves and optionally modify the values
     * @static
     * @method leaves
     * @param {Object|Array|mixed} structure 
     * @param {Function} callback This will be called for every leaf. 
     *   It receives the current value of the leaf, and must return a value
     *   that will be set there (to skip changes, simply return the current value)
     * @return {mixed} the first parameter passed, which was modified during the loop
     */
    Q.leaves = function Q_leaves(structure, callback) {
        if (Q.isArrayLike(structure)) {
            for (var i=0, l=structure.length; i<l; ++i) {
                structure[i] = Q.leaves(structure[i], callback);
            }
        } else if (typeof structure === 'object') {
            for (var k in structure) {
                structure[k] = Q.leaves(structure[k], callback);
            }
        } else { // we found a scalar leaf
            structure = callback(structure);
        }
        return structure;
    };

});