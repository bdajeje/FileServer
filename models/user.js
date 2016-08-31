'use strict'

let mongoose        = require('mongoose'),
    Schema          = mongoose.Schema,
    bcrypt          = require('bcrypt-nodejs'),
    DownloadHistory = require('./download_history');

const Status = {
  Validated: 'validated',
  WaitingValidation: 'waiting',
  Refused: 'refused'
}

const Type = {
  Default: 'default',
  Admin: 'admin'
}

let schema = new Schema({
  pseudo         : {type: String, index: true, unique: true, required: true, trim: true},
  password       : {type: String, required: true},
  ip             : {type: String, required: true},
  status         : {type: String, required: true, default: Status.WaitingValidation},
  createdOn      : {type: Date, default: Date.now},
  lastConnectedOn: {type: Date},
  type           : {type: String, required: true, default: Type.Default},
  quota_limit    : {type: Number, required: true, default: 1e+9}, // in bytes
});

schema.methods.isAllowedToDownloadMore = function(callback) {
  let self = this;
  this.getDownloadQuota(function(download_quota) {
    callback(download_quota < self.quota_limit);
  })
}

schema.methods.setPassword = function(clear_password) {
  this.password = bcrypt.hashSync(clear_password, null, null);
}

schema.methods.isAdmin = function() {
  return this.type === Type.Admin;
}

schema.methods.isValidated = function() {
  return this.status === Status.Validated;
}

schema.methods.isPending = function() {
  return this.status === Status.WaitingValidation;
}

schema.methods.getDownloadQuota = function(callback) {
  let today = new Date;
  today.setHours(0,0,0,0);

  let quota = 0;

  DownloadHistory.find({
    user: this,
    downloaded_on: {$gt: today}
  }, function(error, download_histories) {
    if(error)
      throw error;

    download_histories.forEach(function(download_history) {
      quota += download_history.file_size;
    });

    callback(quota);
  });
}

schema.statics.accept = function(id, callback) {
  this.update({_id: id}, {$set: {status: Status.Validated}}, function(error) {
    if(error)
      throw error;

    return callback();
  });
}

schema.statics.refuse = function(id, callback) {
  this.update({_id: id}, {$set: {status: Status.Refused}}, function(error) {
    if(error)
      throw error;

    return callback();
  });
}

schema.statics.findByPseudo = function(pseudo) {
  return this.findOne({pseudo: pseudo});
}

schema.statics.findByID = function(id) {
  return this.findOne({_id: id});
}

schema.statics.findByIDs = function(ids) {
  return this.find({_id: {$in: ids}});
}

schema.statics.isAvailablePseudo = function(input, callback) {
  this.findOne({pseudo: input}, function(error, user) {
    if(error)
      throw error;

    callback(!user);
  });
}

schema.statics.findPending = function() {
  return this.find({status: Status.WaitingValidation});
}

schema.statics.findActives = function() {
  return this.find({status: Status.Validated});
}

schema.statics.all = function() {
  return this.find({});
}

let User = mongoose.model('User', schema);
User.Status = Status;

module.exports = User;

