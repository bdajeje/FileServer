'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  text: {type: String, required: true, trim: true},
  date: {type: Date, default: Date.now, required: true}
});

schema.statics.all = function() {
  return this.find({});
}

module.exports = mongoose.model('News', schema);
