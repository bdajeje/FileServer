'use strict'

module.exports = {

  generate: function(route, placeholders, host) {
    let result = route.route;

    if(placeholders) {
      for(const placeholder in placeholders)
        result = result.replace(':' + placeholder, encodeURIComponent(placeholders[placeholder]));
    }

    if(!host)
      host = '';

    return `${host}${result}`;
  }

}
