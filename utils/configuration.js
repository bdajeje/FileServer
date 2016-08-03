'use strict'

let fs   = require('fs'),
    path = require('path');

 // Get configuration folder from environment if defined
const config_dir = path.join(__dirname, '../conf');
console.log(`Getting configuration from: ${config_dir}`);

// Read global configuration
let conf = null;
try { conf = JSON.parse( fs.readFileSync(path.join(config_dir, 'app.conf'), 'UTF-8') ); }
catch(error) {
  console.error(`Can\'t read file: ${path.join(config_dir, 'app.conf')}`);
  process.exit();
}

module.exports = conf;
