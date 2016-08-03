'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  user        : {type: Schema.Types.ObjectId, ref: 'User', required: true},
  text        : {type: String, required: true},
  commented_on: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('Comment', schema);
