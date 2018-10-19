var semver = require('semver');
var intersect = require('semver-set').intersect;
var json = require('jju');
var mapValues = require('lodash/mapValues');
var assign = require('lodash/assign');
var isEmpty = require('lodash/isEmpty');

/**
 * [scripts description]
 * @param {Object} dst [description]
 * @param {Object} src [description]
 * @returns {Object}     [description]
 */
function exists(dst, src) {
  return assign({ }, dst, src);
}

/**
 * Keywords work on an ensure-unique basis: if a keyword already exists in dst
 * then it is skipped, otherwise it is placed at the end of dst; the ordering of
 * keywords in src is preserved.
 * @param {Array} dst [description]
 * @param {Array} src [description]
 * @returns {Array}     [description]
 */
function unique(dst, src) {
  if (isEmpty(dst)) {
    return src;
  } else {
    return dst.concat(src.filter(function(keyword) {
      return dst.indexOf(keyword) === -1;
    }));
  }
}

function updateDependencies(dst, src) {
  return isEmpty(dst) ? src : assign({ }, dst, mapValues(src, function(version, dep) {
    // We need to check if both are indeed semver ranges in order to do
    // intersects – some may be git urls or other such things.
    var isSem = semver.validRange(version) && semver.validRange(dst[dep]);
    return isSem ? intersect(version, dst[dep]) || version : version;
  }));
}

/**
 * [combine description]
 * @param {Object} dst [description]
 * @param {Object} src [description]
 * @returns {Object} [description]
 */
function combine(dst, src, handlers) {
  return isEmpty(dst) ? src : assign({ }, dst, mapValues(src, function (value, key) {
    return key in handlers ? handlers[key](dst[key], value) : value;
  }));
}

var default_handlers = {
  // Keywords
  keywords: unique,

  // Scripts
  scripts: exists,

  // General dependencies
  dependencies: updateDependencies,
  devDependencies: updateDependencies,
  peerDependencies: updateDependencies
};

/**
 * [merge description]
 * @param {String} dst [description]
 * @param {String} src [description]
 * @returns {String} Result of merging src into dst.
 */
export default function merge(dst, src) {
  return json.update(dst, combine(json.parse(dst), json.parse(src), default_handlers), { });
}

export function customize(extraHandlers) {
  let handlers = Object.create(default_handlers);
  if(extraHandlers) {
    for(let key in extraHandlers) handlers[key] = extraHandlers[key];
  }

  return function merge(dst, src) {
    return json.update(dst, combine(json.parse(dst), json.parse(src), handlers), { });
  }
};

export var builtins = {
  exists: exists,
  unique: unique,
  updateDependencies: updateDependencies
};
