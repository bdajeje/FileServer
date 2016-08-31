'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  name: {type: String, unique: true, required: true, trim: true, lowecase: true}
});

schema.statics.byName = function(name) {
  return this.findOne({
    name: name
  });
}

schema.statics.all = function(callback) {
  this.find({}, callback);
}

schema.statics.findByNames = function(names) {
  return this.find({name: {$in: names.map(function(name) { return name.toLowerCase(); })}});
}

module.exports = mongoose.model('Tag', schema);
