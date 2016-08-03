'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  name: {type: String, unique: true, required: true, trim: true}
});

schema.statics.all = function(callback) {
  this.find({}, callback);
}

module.exports = mongoose.model('Tag', schema);

