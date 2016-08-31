'use strict'

let Async      = require('async'),
    Connect    = require('connect-ensure-login'),
    Routes     = require('../utils/routes'),
    Categories = require('../models/category'),
    Downloads  = require('../models/download'),
    Tags       = require('../models/tag');

module.exports = function(app) {

  app.get(Routes.browse.route, Connect.ensureLoggedIn(), function(req, res) {
    let categories, downloads, tags, can_download;

    let user_tags = req.query.tags ? req.query.tags.split(',') : [];
    const search  = req.query.search;

    Async.parallel([
      // Get categories
      function(done) {
        Categories.all(function(error, found_categories) {
          categories = found_categories;
          done(error);
        });
      },
      // Get tags
      function(done) {
        Tags.all(function(error, found_tags) {
          tags = found_tags;
          done(error);
        });
      },
      function(done) {
        req.user.isAllowedToDownloadMore(function(can_download_more) {
          can_download = can_download_more;
          done();
        });
      }
    ], function(error) {
      // Keep only existing tags (user may have entered tags directly in the URL, we want to remove the unvalid ones)
      let search_tags = [];
      user_tags.forEach(function(user_tag) {
        const find_result = tags.find(function(tag) {
          if(tag.name === user_tag) {
            search_tags.push(tag);
            return true;
          }

          return false;
        });
      });

      const user_category = req.query.category;
      const category = !user_category ? undefined :
                       categories.find(function(category_it) {
                         return category_it.name === user_category;
                       });

      // Get Downloads
      Downloads.search(search, search_tags, category, function(downloads) {
        // Break down downloads by categories
        let downloads_by_category = {};
        categories.forEach(function(category) {
          downloads_by_category[category._id] = [];

          downloads.forEach(function(download) {
            if(download.category.toString() === category._id.toString())
              downloads_by_category[category._id].push(download);
          });
        });

        return res.render('browse.ejs', {
          search: search,
          selected_category: category ? category.name : undefined,
          categories: categories,
          tags: tags,
          user_tags: search_tags,
          downloads_by_category: downloads_by_category,
          can_download: can_download
        });
      });
    });
  });

}
