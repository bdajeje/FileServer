'use strict'

let Connect         = require('connect-ensure-login'),
    Async           = require('async'),
    Routes          = require('../utils/routes'),
    Security        = require('../utils/security'),
    User            = require('../models/user'),
    Download        = require('../models/download'),
    DownloadHistory = require('../models/download_history'),
    News            = require('../models/news');

module.exports = function(app) {

  // Verify all admin routes, only admin user can access
  app.all(Routes.admin.home.route + '*', Connect.ensureLoggedIn(), function(req, res, next) {
    if(req.user.isAdmin())
      return next();
    else
      return res.redirect(routes.dashboard.route);
  })

  app.get(Routes.admin.home.route, Connect.ensureLoggedIn(), function(req, res, next) {
    let users, last_downloads, active_users, last_uploads;

    Async.parallel([
      function(done) {
        User.findPending()
        .exec(function(error, found_users) {
          users = found_users;
          done(error);
        })
      },
      function(done) {
        DownloadHistory.findLast(10)
        .populate('user', 'pseudo')
        .populate('download', 'name')
        .exec(function(error, found_history) {
          last_downloads = found_history;
          done(error);
        })
      },
      function(done) {
        User.findActives()
        .exec(function(error, found_active_users) {
          active_users = found_active_users;
          done(error);
        })
      },
      function(done) {
        Download.lastUploads(10)
        .populate('uploader', 'pseudo')
        .exec(function(error, found_last_uploads) {
          last_uploads = found_last_uploads;
          done(error);
        })
      }
    ], function(error) {
      if(error)
        return next(error);

      return res.render('admin.ejs', {
        users: users,
        last_downloads: last_downloads,
        active_users: active_users,
        last_uploads: last_uploads
      });
    });
  });

  app.get(Routes.admin.pending_request.accept.route, Connect.ensureLoggedIn(), function(req, res, next) {
    User.accept(req.params.id, function() {
      req.flash('info', 'User accepted');
      return res.redirect(req.previous_url);
    });
  });

  app.get(Routes.admin.pending_request.refuse.route, Connect.ensureLoggedIn(), function(req, res, next) {
    User.refuse(req.params.id, function() {
      req.flash('info', 'User refused');
      return res.redirect(req.previous_url);
    });
  })

  app.post(Routes.admin.create_news.route, Connect.ensureLoggedIn(), function(req, res, next) {
    let news = new News({text: req.body.text});
    news.save(function(error) {
      if(error)
        return next(error);

      req.flash('info', 'News posted');
      return res.redirect(req.previous_url);
    });
  })

}
