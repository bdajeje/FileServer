'use strict'

let Connect         = require('connect-ensure-login'),
    Async           = require('async'),
    Routes          = require('../utils/routes'),
    Security        = require('../utils/security'),
    User            = require('../models/user'),
    Download        = require('../models/download'),
    DownloadHistory = require('../models/download_history'),
    News            = require('../models/news'),
    Rating          = require('../models/report'),
    Comment         = require('../models/report'),
    Report          = require('../models/report');

module.exports = function(app) {

  // Verify all admin routes, only admin user can access
  app.all(Routes.admin.home.route + '*', Connect.ensureLoggedIn(), function(req, res, next) {
    if(req.user.isAdmin())
      return next();
    else
      return res.redirect(routes.dashboard.route);
  })

  app.get(Routes.admin.home.route, Connect.ensureLoggedIn(), function(req, res, next) {
    let last_downloads, users, last_uploads, reports;

    Async.parallel([
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
        User.all()
        .exec(function(error, found_users) {
          users = found_users;
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
      },
      function(done) {
        Report.all()
        .populate('user', 'pseudo')
        .populate('download', 'name')
        .exec(function(error, found_reports) {
          reports = found_reports;
          done(error);
        });
      }
    ], function(error) {
      if(error)
        return next(error);

      return res.render('admin.ejs', {
        last_downloads: last_downloads,
        users: users,
        last_uploads: last_uploads,
        reports: reports
      });
    });
  });

  app.get(Routes.admin.pending_request.accept.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    User.accept(req.params.id, function() {
      req.flash('info', 'User accepted');
      return res.redirect(req.previous_url);
    });
  });

  app.get(Routes.admin.pending_request.refuse.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    User.refuse(req.params.id, function() {
      req.flash('info', 'User refused');
      return res.redirect(req.previous_url);
    });
  })

  app.post(Routes.admin.create_news.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    let news = new News({text: req.body.text});
    news.save(function(error) {
      if(error)
        return next(error);

      req.flash('info', 'News posted');
      return res.redirect(req.previous_url);
    });
  })

  app.post(Routes.admin.ban_user.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    User.findByID(req.body.id)
    .exec(function(error, user) {
      if(error)
        return next(error);

      if(!user) {
        req.flash('error', 'Can\'t find user');
        return res.redirect(req.previous_url);
      }

      user.status = User.Status.Refused;
      user.save(function(error) {
        if(error)
          return next(error);

        req.flash('info', `User ${user.pseudo} banned`);
        return res.redirect(req.previous_url);
      });
    });
  })

  app.post(Routes.admin.unban_user.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    User.findByID(req.body.id)
    .exec(function(error, user) {
      if(error)
        return next(error);

      if(!user) {
        req.flash('error', 'Can\'t find user');
        return res.redirect(req.previous_url);
      }

      user.status = User.Status.Validated;
      user.save(function(error) {
        if(error)
          return next(error);

        req.flash('info', `User ${user.pseudo} unbanned`);
        return res.redirect(req.previous_url);
      });
    });
  })

  app.get(Routes.admin.download.delete.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Download.byID(req.params.id)
    .exec(function(error, download) {
      if(!download)
        return res.redirect(req.previous_url);

      Rating.remove({ _id: download.ratings });
      Comment.remove({ _id: download.comments });
      Download.remove({ _id: download._id });
      Report.remove({download: download}, function() {
        req.flash('info', 'Download deleted');
        return res.redirect(req.previous_url);
      });
    })
  });

  app.get(Routes.admin.download.unreport.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Report.remove({download: req.params.id}, function() {
      req.flash('info', 'Download unreported');
      return res.redirect(req.previous_url);
    })
  });

}
