'use strict'

let Connect         = require('connect-ensure-login'),
    Routes          = require('../utils/routes'),
    Security        = require('../utils/security'),
    Downloads       = require('../models/download'),
    DownloadHistory = require('../models/download_history'),
    Rating          = require('../models/rating'),
    Comment         = require('../models/comment');

module.exports = function(app) {

  app.get(Routes.downloadable.view.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .populate('uploader', 'pseudo')
    .populate({path: 'comments', populate: {path: 'user'}})
    .populate('category tags')
    .populate({path: 'ratings', populate: {path: 'user', select: 'pseudo'}})
    .exec(function(error, downloadable) {
      if(error)
        return next(error);

      return res.render('downloadable.ejs', {
        downloadable: downloadable
      });
    });
  });

  app.get(Routes.downloadable.download.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .populate('category')
    .exec(function(error, download) {
      if(error)
        return next(error);

      return res.download(download.getFilePath());
    });
  });

  app.get(Routes.downloadable.download_extra.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .populate('category')
    .exec(function(error, download) {
      if(error)
        return next(error);

      return res.download(download.getExtraFilePath(req.params.extra));
    });
  });

}
