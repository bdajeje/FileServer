'use strict'

let mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    bcrypt   = require('bcrypt-nodejs');

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
  type           : {type: String, required: true, default: Type.Default}
});

schema.methods.isAllowedToDownloadMore = function() {
  return false;
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

