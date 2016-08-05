'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    Config   = require('../utils/configuration');

let schema = new Schema({
  name:        {type: String, required: true, trim: true},
  category   : {type: Schema.Types.ObjectId, ref: 'Category', required: true},
  tags       : [{type: Schema.Types.ObjectId, ref: 'Tag'}],
  uploader   : {type: Schema.Types.ObjectId, ref: 'User', required: true},
  uploaded_on: {type: Date, default: Date.now, required: true},
  ratings    : [{type: Schema.Types.ObjectId, ref: 'Rating'}],
  comments   : [{type: Schema.Types.ObjectId, ref: 'Comment'}],
  extra      : {type: Schema.Types.Mixed}
});

schema.methods.getFilePath = function() {
  return `${Config['data']['path']}/${this.category.name}/${this.name}`
}

schema.methods.getExtraFilePath = function(type) {
  return `${Config['data']['path']}/${this.category.name}/${this.extra[type]}`
}

schema.methods.getName = function() {
  const index = this.name.lastIndexOf('.');
  if(index === -1)
    return this.name;

  return this.name.substring(0, index);
}

schema.methods.hasExtra = function(type) {
  return this.extra === type;
}

schema.statics.search = function(search, tags, category, callback) {
  // If no criteria given, don't search
  if((!search   || search.empty()) &&
     (!tags     || tags.empty())   &&
     !category )
    return callback([]);

  let query = {};

  if(search && search.length > 0)
    query.name = new RegExp('.*' + search + '.*', 'i');
  if(tags && tags.length > 0)
    query.tags = {$elemMatch: {$in: tags}};
  if(category)
    query.category = category;

  this.find(query, function(error, results) {
    if(error)
      throw error;

    callback(results);
  });
}

schema.statics.findByNameInCategory = function(name, category_id) {
  return this.findOne({
    name: new RegExp('/^' + name + '$/i'),
    category: category_id
  });
}

schema.statics.lastUploads = function(how_many) {
  return this.find({}).sort({uploaded_on: -1}).limit(how_many);
}

schema.statics.all = function(callback) {
  this.find({}, callback);
}

schema.statics.byID = function(id) {
  return this.findOne({_id: id});
}

module.exports = mongoose.model('Download', schema);
