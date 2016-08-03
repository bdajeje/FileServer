'use strict'

let Connect  = require('connect-ensure-login'),
    Routes   = require('../utils/routes'),
    Security = require('../utils/security'),
    Config   = require('../utils/configuration'),
    Download = require('../models/download');

module.exports = function(app) {

  // Direct access to a private download
  app.get(Routes.data.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Download.byID(req.params.file_id)
    .populate('category', 'name')
    .exec(function(error, download) {
      if(error)
        return next(error);

      if(!download)
        return res.status(404).send('Not found');

      return res.sendFile( download.getFilePath() );
    });
  });

}
