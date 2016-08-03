'use strict'

let Connect         = require('connect-ensure-login'),
    Async           = require('async'),
    Routes          = require('../utils/routes'),
    DownloadHistory = require('../models/download_history'),
    News            = require('../models/news');

module.exports = function(app) {

  app.get(Routes.dashboard.route, Connect.ensureLoggedIn(), function(req, res) {
    let history, news;

    Async.parallel([
      function(done) {
        DownloadHistory.all(req.user._id)
        .select('downloaded_on download')
        .populate('download', 'name')
        .sort({'downloaded_on': -1})
        .exec(function(error, found_history) {
          history = found_history;
          return done(error);
        });
      },
      function(done) {
        News.all().exec(function(error, found_news) {
          news = found_news;
          return done(error);
        })
      }
    ], function(error) {
      if(error)
        throw error;

      return res.render('dashboard.ejs', {
        history: history,
        all_news: news
      });
    });
  });

}
