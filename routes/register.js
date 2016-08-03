'use strict'

let async         = require('async'),
    uuid          = require('uuid'),
    Routes        = require('../utils/routes'),
    Security      = require('../utils/security'),
    Configuration = require('../utils/configuration'),
    User          = require('../models/user');

module.exports = function(app) {

  // Get register view
  app.get(Routes.register.route, function(req, res) {
    res.render('register.ejs');
  });

  // Post register form
  app.post(Routes.register.route, Security.validateRouteParams(), function(req, res, next) {
    const data = req.body;

    if(data.password !== data.password_verif) {
      req.flash('error', 'Both passwords don\'t match');
      return res.redirect(req.previous_url);
    }

    // Check pseudo is not already in use
    User.isAvailablePseudo(data.pseudo, function(pseudo_available) {
      if(!pseudo_available) {
        req.flash('error', `Pseudo ${data.pseudo} already in use.`);
        return res.redirect(req.previous_url);
      }

      // Creating user in database
      let user = new User({
        pseudo: data.pseudo,
        ip    : Security.extractIP(req)
      });
      user.setPassword(data.password);
      user.save(function(error, user) {
        if(error)
          return next(error);

        req.flash('info', 'Account created. Please wait for an administrator to validate it very soon.');
        return res.redirect(Routes.home.route);
      });
    });
  });

}
