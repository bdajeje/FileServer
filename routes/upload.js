'use strict'

let Async    = require('async'),
    Connect  = require('connect-ensure-login'),
    Multer   = require('multer'),
    Upload   = Multer({dest: '/tmp'}),
    Fs       = require('fs'),
    Path     = require('path'),
    Routes   = require('../utils/routes'),
    Security = require('../utils/security'),
    Config   = require('../utils/configuration'),
    Category = require('../models/category'),
    Tags     = require('../models/tag'),
    Download = require('../models/download');

let getExtension = function(filename) {
  const offset = filename.lastIndexOf('.');
  if(offset === -1)
    return '';

  return filename.substring(offset + 1);
}

module.exports = function(app) {

  app.get(Routes.upload.route, Connect.ensureLoggedIn(), function(req, res) {
    let categories, tags;

    Async.parallel([
      function(done) { Category.all(function(error, found_categories) { categories = found_categories; done(error); }) },
      function(done) { Tags.all(function(error, found_tags) { tags = found_tags; done(error); }) }
    ], function(error) {
      return res.render('upload.ejs', {
        categories: categories,
        tags: tags,
        allowNewTags: true
      });
    });
  });

  app.post(Routes.upload.route, Connect.ensureLoggedIn(), function(req, res, next) {
    Upload.single('file')(req, res, function(error) {
      if(error) {
        console.error(error);
        return next(error);
      }

      let doneError = function(status, message) {
        // Delete tmp uploaded file
        Fs.unlink(req.file.path);

        return res.status(status).send(message);
      }

      // Validate parameters
      let params_error = Security.validateParams(Routes.upload.post, req.body, false);
      if(params_error)
        return doneError(400, params_error);

      // Get category name
      Category.findByID(req.body.category, function(error, category) {
        if(error)
          return doneError(500, 'Internal error');

        if(!category)
          return doneError(400, 'Wrong category');

        // Check name isn't already in use
        Download.findByNameInCategory(req.body.name, category._id)
        .exec(function(download) {
          if(download)
            return doneError(400, 'This name is already taken, please use another one.');

          // Check tags
          if(req.body.tags.empty())
            return doneError(400, 'At least one tag is required');

          // Saving file (moving from tmp folder to appropriate one)
          const name = req.body.name + '.' + getExtension(req.file.originalname).toLowerCase();
          const from = req.file.path;
          const to   = Path.join(Config['data']['path'], category.name, name);
          Fs.renameSync(from, to);

          // Split tags string, find existing one, create new ones for non existing
          let tags = [];
          const user_tags = req.body.tags.split(',').removeIf(function(elem) { return elem && !elem.empty() });
          Tags.findByNames(user_tags)
          .exec(function(error, found_tags) {
            if(error)
              throw error;

            tags = tags.concat( found_tags );

            // For all not found tags create new one
            let tags_to_create = [];
            user_tags.forEach(function(user_tag) {
              const found = tags.find(function(tag) {
                return tag.name === user_tag;
              });

              if(!found) {
                tags_to_create.push(function(done) {
                  let tag = new Tags({name: user_tag});
                  tag.save(function(error, tag) {
                    tags.push(tag);
                    return done(error);
                  });
                });
              }
            });

            Async.parallel(tags_to_create, function(error) {
              if(error)
                throw error;

              // Saving new file in DB
              let download = new Download({
                name: name,
                category: category,
                tags: tags,
                uploader: req.user
              });

              download.save(function(error) {
                if(error)
                  return doneError(500, error.stack);

                return res.send('OK');
              });
            });
          });
        });
      });
    });
  });

}
