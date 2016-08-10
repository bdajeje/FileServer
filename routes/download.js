'use strict'

let Connect         = require('connect-ensure-login'),
    Routes          = require('../utils/routes'),
    Security        = require('../utils/security'),
    Downloads       = require('../models/download'),
    DownloadHistory = require('../models/download_history'),
    Rating          = require('../models/rating'),
    Comment         = require('../models/comment'),
    Report          = require('../models/report');

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

      if(!downloadable)
        return res.redirect(req.previous_url);

      // Find user rating on this download
      const user_id = req.user._id.toString();
      const user_rating = downloadable.ratings.find(function(rating) {
        return rating.user._id.toString() === user_id;
      });

      return res.render('downloadable.ejs', {
        downloadable: downloadable,
        user_rating: user_rating
      });
    });
  });

  app.get(Routes.downloadable.download.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .populate('category')
    .exec(function(error, download) {
      if(error)
        return next(error);

      if(!download)
        return res.redirect(req.previous_url);

      return res.download(download.getFilePath());
    });
  });

  app.get(Routes.downloadable.download_extra.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .populate('category')
    .exec(function(error, download) {
      if(error)
        return next(error);

      if(!download)
        return res.redirect(req.previous_url);

      return res.download(download.getExtraFilePath(req.params.extra));
    });
  });

  // Ajax requests are sent to this enpoint
  app.get(Routes.downloadable.rate.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .populate('ratings')
    .exec(function(error, download) {
      if(error)
        throw error;

      if(!download)
        return res.status(400).send('Wrong resource');

      const user_id = req.user._id.toString();
      let rating    = null;

      // Try to find already existing rating for this user
      for(let i = 0, nbr = download.ratings.size(); i < nbr; ++i) {
        const existing_rating = download.ratings[i];
        if(existing_rating.user.toString() === user_id) {
          rating = existing_rating;
          break;
        }
      };

      // User didn't already rate this download, create an new one
      let new_rating = false;
      if(!rating) {
        new_rating = true;
        rating = new Rating({ user: req.user });
      }

      var done = function() {
        return res.send('OK');
      }

      rating.rate = req.params.rate;
      rating.save(function(error) {
        if(error)
          throw error;

        // Add rating to download
        if(new_rating) {
          download.ratings.push(rating);
          download.save(function(error) {
            if(error)
              throw error;

            done();
          });
        }
        else
          done();
      });
    });
  });

  app.get(Routes.downloadable.report.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .exec(function(error, download) {
      if(!download)
        return res.status(400).send('Client error');

      // Check if file isn't already reported
      Report.findByDownload(download._id)
      .exec(function(error, found_report) {
        let done = function() {
          req.flash('info', 'Thank you, this file has been reported');
          return res.redirect(req.previous_url);
        };

        if(found_report)
          return done();

        let report = new Report({
          user: req.user,
          download: download
        });

        report.save(function(error) {
          if(error)
            throw error;

          return done();
        });
      });
    });
  });

}
