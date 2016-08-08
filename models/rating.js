'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  rate: {type: Number, required: true}
});

schema.statics.all = function() {
  return this.find({});
}

module.exports = mongoose.model('Rating', schema);
