'use strict'

let Routes  = require('./routes'),
    Routing = require('./routing');

// Build reverse routes (from route to 'get', 'post' and 'url' properties)
let reverse = {};

let findRoutes = function(route_path) {
  // Find object from route path
  let route_level = Routes;
  for(let i = 0; i < route_path.size(); ++i)
    route_level = route_level[route_path[i]];

  // Check if there is a route key on this level
  if(route_level.hasOwnProperty('route')) {
    reverse[route_level.route] = {};
    ['get', 'post', 'url'].forEach(function(wanted_property) {
      if(route_level.hasOwnProperty(wanted_property))
        reverse[route_level.route][wanted_property] = route_level[wanted_property];
    });
  }

  // Check is there a still levels to pass through
  if(typeof route_level === 'object') {
    for(let key in route_level) {
      // Ignore properties we know are not sub levels
      if(['get', 'post', 'url'].indexOf(key) != -1)
        continue;

      findRoutes(route_path.concat([key]));
    }
  }
}

for(let key in Routes)
  findRoutes([key]);

module.exports = reverse;
