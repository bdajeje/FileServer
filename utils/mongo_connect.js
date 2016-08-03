'use strict'

let mongoose = require('mongoose');

module.exports = function(Configuration) {

  mongoose.connect(`mongodb://${Configuration['address']}/${Configuration['collection']}`);
  mongoose.connection.on('error', function(error) { throw error; });

}
