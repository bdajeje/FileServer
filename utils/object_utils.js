'use strict'

module.exports = {

  values: function(object) {
    if(typeof object !== 'object')
      throw 'This is not an object';

    return Object.keys(object).map(function(key) { return object[key]; })
  }

}
