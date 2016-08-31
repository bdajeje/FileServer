'use strict'

let Async           = require('async'),
    Fs              = require('fs'),
    Connect         = require('connect-ensure-login'),
    Routes          = require('../utils/routes'),
    Security        = require('../utils/security'),
    Downloads       = require('../models/download'),
    DownloadHistory = require('../models/download_history'),
    Rating          = require('../models/rating'),
    Comment         = require('../models/comment'),
    Report          = require('../models/report'),
    Tag             = require('../models/tag');

module.exports = function(app) {

  app.get(Routes.downloadable.view.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    let downloadable, tags;

    Async.parallel([
      // Get tags
      function(done) {
        Tag.all(function(error, found_tags) {
          tags = found_tags;
          done(error);
        });
      },
      function(done) {
        Downloads.byID(req.params.id)
        .populate('uploader', 'pseudo')
        .populate({path: 'comments', populate: {path: 'user'}})
        .populate('category tags')
        .populate({path: 'ratings', populate: {path: 'user', select: 'pseudo'}})
        .exec(function(error, found_downloadable) {
          downloadable = found_downloadable;
          done(error);
        });
      }
    ], function(error) {
      if(error)
        return next(error);

      if(!downloadable)
        return res.redirect(req.previous_url);

      // Find user rating on this download
      const user_id = req.user._id.toString();
      const user_rating = downloadable.ratings.find(function(rating) {
        return rating.user._id.toString() === user_id;
      });

      // Remove already used tags from download tags
      downloadable.tags.forEach(function(already_added_tag) {
        tags = tags.removeIf(function(tag) {
          return tag.name === already_added_tag.name;
        });
      });

      return res.render('downloadable.ejs', {
        downloadable: downloadable,
        user_rating: user_rating,
        tags: tags
      });
    });
  });

  app.get(Routes.downloadable.download.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    req.user.isAllowedToDownloadMore(function(can_download_more) {
      if(!can_download_more) {
        req.flash('error', 'You can\'t download anymore today. Please come back tomorrow.');
        return res.redirect(req.previous_url);
      }

      Downloads.byID(req.params.id)
      .populate('category')
      .exec(function(error, download) {
        if(error)
          return next(error);

        if(!download)
          return res.redirect(req.previous_url);

        let download_history = new DownloadHistory({
          user: req.user,
          download: download,
          ip: req.ip || 'unknown',
          file_size: Fs.statSync(download.getFilePath())['size']
        });
        download_history.save(function(error) { if(error) throw error; });

        return res.download(download.getFilePath());
      });
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

  app.post(Routes.downloadable.comment.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    Downloads.byID(req.params.id)
    .exec(function(error, download) {
      if(!download)
        return res.status(400).send('Client error');

      let comment = new Comment({
        user: req.user,
        text: req.body.text
      });

      download.comments.push(comment);

      Async.parallel([
        function(done) { comment.save(function(error) { done(error); }); },
        function(done) { download.save(function(error) { done(error); }); }
      ], function(error) {
        if(error)
          throw error;

        res.send('OK');
      });
    });
  });

  app.post(Routes.downloadable.tag.route, Connect.ensureLoggedIn(), Security.validateRouteParams(), function(req, res, next) {
    let tag, download;

    Async.parallel([
      function(done) {
        Downloads.byID(req.params.id)
        .populate('tags', 'name')
        .exec(function(error, found_download) {
          download = found_download;
          done(error);
        });
      },
      function(done) {
        Tag.byName(req.body.name)
        .exec(function(error, found_tag) {
          tag = found_tag;
          done(error);
        })
      }
    ], function(error) {
      if(!download)
        return res.status(400).send('Client error');

      const tag_name = req.body.name;
      if(download.hasTag(tag_name)) {
        return res.status(400).send('Client error');
      }

      let new_tag = false;
      if(!tag) {
        new_tag = true;
        tag = new Tag({ name: tag_name });
      }
      download.tags.push(tag);

      Async.parallel([
        function(done) {
          if(new_tag)
            tag.save(function(error) { done(error); });
          else
            done();
        },
        function(done) {
          download.save(function(error) { done(error); });
        }
      ], function(error) {
        if(error)
          throw error;

        res.send('OK');
      });
    });
  });

}
