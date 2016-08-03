'use strict'

/************* STRING **************/

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.empty = function() {
  return this.length === 0;
};

String.prototype.toASCII = function() {
  return this.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
}

/************* ARRAY **************/

Array.prototype.pushIfValid = function(input) {
  if(input) this.push(input);
};

Array.prototype.first = function() {
  return this.empty() ? null : this[0];
};

Array.prototype.last = function() {
  return this.empty() ? null : this[this.length - 1];
};

Array.prototype.size = function() {
  return this.length;
}

Array.prototype.empty = function() {
  return this.length === 0;
};

Array.prototype.unique = function() {
  let u = {};
  let a = [];

  for(let i = 0, l = this.length; i < l; ++i) {
    if(u.hasOwnProperty(this[i]))
       continue;

    a.push(this[i]);
    u[this[i]] = 1;
  }

  return a;
}

Array.prototype.remove = function(element) {
  const index = this.indexOf(element);
  if(index !== -1)
    this.splice(index, 1);

  return index;
}
