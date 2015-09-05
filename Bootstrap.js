//ES6 Polyfill(s)
var traceur = require('traceur');
traceur.require.makeDefault(function(filename) {
    return filename.indexOf('node_modules') === -1;
});

require('./App');