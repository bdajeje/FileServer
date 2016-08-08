'use strict'

let Connect  = require('connect-ensure-login'),
    Routes   = require('../utils/routes'),
    ObjUtils = require('../utils/object_utils'),
    User     = require('../models/user'),
    Rating   = require('../models/rating'),
    Download = require('../models/download');

const NbrTopRaters    = 5;
const NbrTopUploaders = 5;

module.exports = function(app) {

  app.get(Routes.users.all.route, Connect.ensureLoggedIn(), function(req, res) {
    User.all()
    .exec(function(error, users) {
      return res.render('users.ejs', {
        users: users,
        type: 'all',
        nbr_top_rators: NbrTopRaters,
        nbr_top_uploaders: NbrTopUploaders
      });
    });
  });

  app.get(Routes.users.best_rators.route, Connect.ensureLoggedIn(), function(req, res) {
    Rating.all()
    .exec(function(error, ratings) {
      // Find 5 users who rate the most

      // Find number of rates per user
      let nbr_ratings_per_user = {};
      ratings.forEach(function(rating) {
        if(nbr_ratings_per_user[rating.user])
          nbr_ratings_per_user[rating.user]++;
        else
          nbr_ratings_per_user[rating.user] = 1;
      });

      const user_ids = Object.keys(nbr_ratings_per_user);
      const sorted_user_ids = user_ids.sort(function(user_id_a, user_id_b) {
        return nbr_ratings_per_user[user_id_a] < nbr_ratings_per_user[user_id_b];
      }).slice(0, NbrTopRaters);

      // Extract rates per user into an array, sort the array descending
      User.findByIDs(sorted_user_ids)
      .exec(function(error, users) {
        if(error)
          throw error;

        return res.render('users.ejs', {
          users: users,
          nbr_ratings_per_user: nbr_ratings_per_user,
          type: 'rators',
          nbr_top_rators: NbrTopRaters,
          nbr_top_uploaders: NbrTopUploaders
        });
      })
    });
  });

  app.get(Routes.users.best_uploaders.route, Connect.ensureLoggedIn(), function(req, res) {
    Download.aggregate([ {"$group": {_id: "$uploader", count:{$sum:1}}} ], function(error, results) {
      const sorted_results = results.sort(function(result_a, result_b) {
        return result_a.count < result_a.count;
      }).slice(0, NbrTopUploaders);

      User.findByIDs(sorted_results.map(function(sorted_result) { return sorted_result._id; }))
      .exec(function(error, users) {
        if(error)
          throw error;

        let nbr_uploads_per_user = {};
        sorted_results.forEach(function(sorted_result) {
          nbr_uploads_per_user[sorted_result._id] = sorted_result.count;
        });

        return res.render('users.ejs', {
          users: users,
          nbr_uploads_per_user: nbr_uploads_per_user,
          type: 'uploaders',
          nbr_top_rators: NbrTopRaters,
          nbr_top_uploaders: NbrTopUploaders
        });
      })
    });
  });

}
