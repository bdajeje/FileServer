'use strict'

module.exports = {

  renderDate: function(date) {
    if(!date)
      return null;

    var month = date.getMonth() + 1;
    var day   = date.getDate();

    if( month < 10 ) month = '0' + month;
    if( day < 10 )   day   = '0' + day;

    return day + '/' + month + '/' + date.getFullYear();
  }

}
