'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  user          : {type: Schema.Types.ObjectId, ref: 'User', index: true, required: true},
  download      : {type: Schema.Types.ObjectId, ref: 'Download', required: true},
  ip            : {type: String, required: true},
  downloaded_on : {type: Date, default: Date.now, required: true}
});

schema.statics.all = function(user_id) {
  return this.find({
    user: user_id
  });
}

schema.statics.findLast = function(how_many) {
  return this.find({}).sort({downloaded_on: -1}).limit(how_many);
}

module.exports = mongoose.model('DownloadHistory', schema);
