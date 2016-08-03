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
        tags: tags
      });
    });
  });

  app.post(Routes.upload.route, Connect.ensureLoggedIn(), function(req, res, next) {
    Upload.single('file')(req, res, function(error) {
      if(error) {
        console.error(error);
        return next(error);
      }

      // Validate parameters
      const params_error = Security.validateParams(Routes.upload.post, req.body, false)
      if(params_error) {
        // Delete tmp uploaded file
        Fs.unlink(req.file.path);

        return res.status(400).send(params_error);
      }

      // Get category name
      Category.findByID(req.body.category, function(error, category) {
        if(error) {
          console.error(error);
          return res.status(500).send('Internal error');
        }

        if(!category)
          return res.status(400).send('Wrong category');

        // Saving file (moving from tmp folder to appropriate one)
        const name = req.body.name + '.' + getExtension(req.file.originalname);
        const from = req.file.path;
        const to   = Path.join(Config['data']['path'], category.name, name);

        Fs.renameSync(from, to);

        // Saving new file in DB
        let download = new Download({
          name: name,
          category: category,
          // tags
          uploader: req.user
        });

        download.save(function(error) {
          if(error) {
            console.error(error);
            return next(error);
          }

          return res.send('OK');
        });
      });
    });
  });

}
