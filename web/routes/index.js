var path = require('path'),
  uuid = require('node-uuid'),
  async = require('async'),
  child_process = require('child_process'),
  _ = require('lodash'),
  fs = require('fs-extra'),
  ticons = require('ticons'),
  pkg = require('../../package.json'),
  cliPkg = require('../../node_modules/ticons/package.json'),
  utils = require('../../lib/utils'),
  tiConstants = require('../../node_modules/ticons/lib/constants'),
  CFG = require('../../conf/app');
  S3 = require('aws-sdk/clients/s3');

module.exports = function(req, resp, next) {

    if (req.method !== 'POST') {
      return respond(req, resp);
    }

    // convert to bool
    req.body.alloy = !!req.body.alloy;
    req.body.label = !!req.body.label;
    req.body['storyboard'] = !!req.body['storyboard'];
    req.body['no-nine'] = !req.body['no-nine'];
    req.body['no-crop'] = !req.body['no-crop'];
    req.body['no-fix'] = !req.body['no-fix'];

    // convert to int
    req.body['min-dpi'] = parseInt(req.body['min-dpi'], 10);
    req.body['max-dpi'] = parseInt(req.body['max-dpi'], 10);
    req.body.width = req.body.width ? parseInt(req.body.width, 10) : undefined;
    req.body.height = req.body.height ? parseInt(req.body.height, 10) : undefined;
    req.body.radius = parseInt(req.body.radius, 10);

    // fix arrays
    utils.fixArrays(req, 'outputs');
    utils.fixArrays(req, 'platforms');
    utils.fixArrays(req, 'orientations');

    if (req.body.locale != '' && !/^[a-z]{2}/.test(req.body.locale)) {
      return respond(req, resp, 'Invalid language.');
    }

    var doIcons = req.body.outputs.indexOf('icons') !== -1;
    var doSplashes = req.body.outputs.indexOf('splashes') !== -1;
    var doAssets = req.body.outputs.indexOf('assets') !== -1;

    if (!doIcons && !doSplashes && !doAssets) {
      return respond(req, resp, 'Select an output.');
    }

    if (doAssets && (doIcons || doSplashes)) {
      return respond(req, resp, 'You cannot combine assets with other types of output.');
    }

    var iconsOpts, splashesOpts, assetsOpts;

    resp.locals.examples = {};

    if (doIcons) {
      iconsOpts = select(req, resp, 'icons');
    }

    if (doSplashes) {
      splashesOpts = select(req, resp, 'splashes');
    }

    if (doAssets) {
      assetsOpts = select(req, resp, 'assets');
    }

    if (!req.file) {
      return respond(req, resp, 'Input is missing.');

    } else if (doAssets) {

      if (req.file.mimetype !== 'image/png' && req.file.mimetype !== 'image/jpeg') {
        return respond(req, resp, 'Input for assets must be a PNG or JPEG.');
      }

    } else {

      if (req.file.mimetype !== 'image/png') {
        return respond(req, resp, 'Input for icons and splashes must be a PNG.');
      }

    }

    var name = uuid.v1();
    var fileName = name + (CFG.useTar ? '.tar.gz' : '.zip');
    var tmpPath = path.join(CFG.tmpPath, name);
    var zipPath = path.join(CFG.tmpPath, fileName);
    var zipUrl;

    async.series({

      icons: function(next) {

        if (!doIcons) {
          return next();
        }

        iconsOpts.outputDir = tmpPath;

        ticons.icons(iconsOpts, next);
      },

      splashes: function(next) {

        if (!doSplashes) {
          return next();
        }

        splashesOpts.outputDir = tmpPath;

        ticons.splashes(splashesOpts, next);
      },

      assets: function(next) {

        if (!doAssets) {
          return next();
        }

        assetsOpts.outputDir = tmpPath;

        ticons.assets(assetsOpts, next);
      },

      zip: function(next) {
        zip({
          input: tmpPath,
          output: zipPath,
          useTar: CFG.useTar
        }, next);
      },

      upload: function(next) {

        var s3bucket = new S3({
          region: CFG.s3.region,
          params: {
            Bucket: CFG.s3.bucket
          }
        });

        s3bucket.upload({
          Body: fs.createReadStream(zipPath),
          StorageClass: 'REDUCED_REDUNDANCY',
          Key: fileName
        }, function(err, data) {

          if (err) {
            return next(err);
          }

          zipUrl = data.Location;

          return next();
        });
      }

    }, function(ticonsErr, results) {
      var errors = [];

      if (ticonsErr) {
        console.error(ticonsErr);
        errors.push(ticonsErr.toString());
      }

      // clean up
      try {
        fs.removeSync(tmpPath);
        fs.removeSync(zipPath);
        if (req.file) {
          fs.removeSync(req.file.file);
        }
      } catch (err) {
        console.error('Error cleaning up: ' + err);
      }

      if (ticonsErr) {
        return respond(req, resp, errors);
      }

      return respond(req, resp, {
        zipUrl: zipUrl
      });
    });
  };

function respond(req, resp, opts) {

  if (_.isArray(opts)) {
    opts = {
      errors: opts
    };
  } else if (_.isString(opts)) {
    opts = {
      errors: [opts]
    };
  } else if (!_.isObject(opts)) {
    opts = {};
  }

  opts.version = pkg.version;
  opts.cliVersion = cliPkg.version;
  opts.dpi = {};

  _.each(tiConstants.dpi, function(val, key) {

    if (['@1x', 'retinahd', 'retina', 'retina-hd'].indexOf(key) !== -1) {
      return;
    }

    if (opts.dpi[val]) {
      opts.dpi[val].push(key);
    } else {
      opts.dpi[val] = [key];
    }

  });

  opts.dpi = _.invert(_.mapValues(opts.dpi, function(val) {
    return val.join('/');
  }));

  opts.orientations = CFG.orientations;
  opts.outputs = CFG.outputs;
  opts.params = (req.method !== 'POST') ? CFG.defaults : req.body;
  opts.platforms = CFG.platforms;

  resp.render('index', opts);
}

function zip(opts, callback) {

  child_process.exec((opts.useTar ? 'tar -zcvf' : 'zip -r') + ' ' + opts.output + ' ./', {
    cwd: opts.input,

  }, function(error, stdout, stderr) {
    callback(error);
  });
}

function select(req, resp, output) {

  var args = {
    'output-dir': 'path/to/your/project',
    'alloy': req.body.alloy,
    'platforms': req.body.platforms
  };

  var keys = ['sdk-version', 'alloy-base', 'min-dpi', 'max-dpi', 'label'];

  if (output === 'icons') {
    keys.push('radius');
  } else if (output === 'splashes') {
    keys.push('locale', 'orientation', 'width', 'height', 'storyboard', 'no-nine', 'no-crop', 'no-fix');
  } else {
    keys.push('orig-dpi');
  }

  keys.forEach(function(key) {
    if (req.body[key] !== CFG.defaults[key] && req.body[key] !== '') {
      args[key] = req.body[key];
    }
  });

  resp.locals.examples[output] = {};
  resp.locals.examples[output].cli = 'ticons ' + output + ' ' + (req.file ? req.file.originalName : 'path/to/your/image.png') + ' ' + utils.toArgs(args);
  var opts = utils.toCamelCase(args);
  opts.input = req.file ? req.file.originalName : 'path/to/your/image.png';
  resp.locals.examples[output].module = 'ticons.' + output + '(' + JSON.stringify(opts, null, '  ') + ', function(err, files) {});';
  opts.input = req.file ? req.file.path : undefined;

  return opts;
}