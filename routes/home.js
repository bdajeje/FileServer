'use strict'

let Routes = require('../utils/routes');

module.exports = function(app) {

  app.get(Routes.home.route, function(req, res) {
    if(req.user)
      return res.redirect(Routes.dashboard.route);
    else
      return res.redirect(Routes.login.route);
  });

}
