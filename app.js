'use strict'

// Extends objects properties
require('./utils/extends');

let express        = require('express'),
    app            = express(),
    expressLayouts = require('express-ejs-layouts'),
    fs             = require('fs'),
    path           = require('path'),
    passport       = require('passport'),
    bodyParser     = require('body-parser'),
    cookieParser   = require('cookie-parser'),
    session        = require('express-session'),
    redisStore     = require('connect-redis')(session),
    redis          = require('redis'),
    Routes         = require('./utils/routes'),
    Configuration  = require('./utils/configuration'),
    ViewUtils      = require('./utils/view_utils');

// Read SSL conf
let https = require('https').createServer({
  key: fs.readFileSync(path.join(__dirname, './conf/ssl/server.key'), 'utf8'),
  cert: fs.readFileSync(path.join(__dirname, './conf/ssl/server.crt'), 'utf8')
}, app);

// Connection to mongodb
require('./utils/mongo_connect')(Configuration['mongo']);

// Passport configuration
require('./utils/passport')(passport, app);

// Set up ejs for templating
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser(Configuration['session']['secret']));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: Configuration['session']['secret'],
  resave: false,
  saveUninitialized: false,
  store: new redisStore({
                          client: redis.createClient(),
                          host: Configuration['redis']['host'],
                          port: Configuration['redis']['port'],
                          ttl: Configuration['redis']['ttl'],
                          db: Configuration['redis']['db_number']
                        })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('connect-flash')());

// Middleware to set some values before routing
app.use(function(req, res, next) {
  // Update previous URL
  req.session.previous_url = req.header('Referer') || req.session.previous_url || Routes.home.route;
  req.previous_url         = req.session.previous_url; // alias

  // Those values go to views
  res.locals.user     = req.user;
  res.locals.messages = require('express-messages')(req, res);
  res.locals.routes   = Routes;
  res.locals.routing  = require('./utils/routing');

  res.locals.renderDate = ViewUtils.renderDate;

  next();
});

app.use(expressLayouts);

// Routing
require('./routes/home.js')(app);
require('./routes/login.js')(app, passport);
require('./routes/logout.js')(app);
require('./routes/register.js')(app);
require('./routes/dashboard.js')(app);
require('./routes/browse.js')(app);
require('./routes/download.js')(app);
require('./routes/upload.js')(app);
require('./routes/view_data.js')(app);
require('./routes/users.js')(app);
require('./routes/admin.js')(app);

// Catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  res.status(404).render('404.ejs');
});

// Error handler
app.use(function(error, req, res, next) {
  console.error(error.stack);
  res.status(500).render('500.ejs');
});

// Start application
const https_port = Configuration['server']['https_port'];
let server = https.listen(https_port, function () {
  console.log(`HTTPS listening on port ${https_port}`);
});

// Disable 'x-powered-by' http header
app.disable('x-powered-by');

// Listen for TERM (kill) and INT (Ctrl-C) signals for graceful shutdown
let force_shut_down = false;
let gracefulShutdown = function(signal) {
  if(force_shut_down) {
    console.info('Signal to kill server already received, forcing kill.');
    process.exit();
  }

  console.info(`Received signal to shutdown (${signal})`);
  force_shut_down = true;

  console.info('Server shutting down...');
  server.close(function() {
    console.info('Server shutted down!');
    process.exit();
  });
};
process.on('SIGTERM', function() { gracefulShutdown('SIGTERM'); });
process.on('SIGINT', function() { gracefulShutdown('SIGINT'); });
