'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

let schema = new Schema({
  user:        {type: Schema.Types.ObjectId, ref: 'User', required: true},
  download:    {type: Schema.Types.ObjectId, ref: 'Download', required: true, index: true},
  reported_on: {type: Date, default: Date.now, required: true}
});

schema.statics.findByDownload = function(download_id) {
  return this.findOne({
    download: download_id
  });
}

schema.statics.all = function() {
  return this.find({});
}

module.exports = mongoose.model('Report', schema);
