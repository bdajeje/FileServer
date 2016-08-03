'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  name:      {type: String, unique: true, required: true, trim: true},
  logo:      {type: String, required: true},
  mime_type: {type: String, required: true}
});

schema.statics.all = function(callback) {
  this.find({}, callback);
}

schema.statics.findByID = function(id, callback) {
  this.findOne({_id: id}, callback);
}

module.exports = mongoose.model('Category', schema);
