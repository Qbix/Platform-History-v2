/*

Copyright (c) 2010 Votizen Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

var querystring = require('querystring'),
    https       = require('https');


/*
 * Empty function for use when a callback isn't supplied.
**/
function noop() {}


/*
 * Takes a given node of an object and formats it accordingly
 *
 * @param {Mixed}      node        The given node of an object.
 * @private
**/
function format(node) {
  if (Array.isArray(node)) {
    return formatObject(node).join(',');
  } else if (typeof node == 'object') {
    return JSON.stringify(node);
  } else {
    return node;
  }
}


/*
 * Takes a given object and formats it according to format()
 *
 * @param {Object}      obj        The object to format.
 * @return {Object} The formatted object.
 * @private
**/
function formatObject(obj) {
  var keys = Object.keys(obj), result = Array.isArray(obj) ? [] : {};
  for (var i = 0, l = keys.length; i < l; i++) {
    result[keys[i]] = format(obj[keys[i]]);
  }
  return result;
}



/**
 * Creates a new Facebook Graph Client with the optional access_token.<br/>
 * Copyright (c) 2010 Votizen Incorporated
 *
 * @class Client
 * @param  {String}  access_token=null  Optional user access_token.
 * @constructor
**/
function Client(access_token) {
  this.access_token = access_token || null;
  this.host = 'graph.facebook.com';
}


/*
 * Publicly export Client.
**/
exports.Client = Client;


/**
 * Publicly export Client.
 *
 * @see Client
 * @method createClient
 * @param  {String}  access_token  Optional user access_token.
 * @return {Client} The new Client instance.
**/
exports.createClient = function(access_token) {
  return new Client(access_token);
};


/**
 * Sends a POST request for an Object on the Graph
 *
 * @param {String}    id          The facebook users' id (or 'me').
 * @param {Object}    args        Any extra arguments for the querystring.
 *                                Eg, since, until, access_token, etc.
 * @param {Function}  cb          Callback function.
**/
Client.prototype.postObject = function(id, args, cb) {
  this.request('post', id, args, cb);
};


/**
 * Sends a DELETE request for an Object on the Graph
 *
 * @param {String}    id          The facebook users' id (or 'me').
 * @param {Object}    args        Any extra arguments for the querystring.
 *                                Eg, since, until, access_token, etc.
 * @param {Function}  cb          Callback function.
**/
Client.prototype.deleteObject = function(id, args, cb) {
  this.request('delete', id, args, cb);
};


/**
 * Sends a GET request for an Object on the Graph
 *
 * @param {String}    id          The facebook users' id (or 'me').
 * @param {Object}    args        Any extra arguments for the querystring.
 *                                Eg, since, until, access_token, etc.
 * @param {Function}  cb          Callback function.
**/
Client.prototype.getObject = function(id, args, cb) {
  this.request('get', id, args, cb);
};


/**
 * Sends a GET request for multiple Objects on the Graph
 *
 * @param {String[]}  ids         The facebook user ids.
 * @param {Object}    args={}        Any extra arguments for the querystring.
 *                                Eg, since, until, access_token, etc.
 * @param {Function}  cb          Callback function.
**/
Client.prototype.getObjects = function(ids, args, cb) {
  if (!cb && typeof args == 'function') {
    cb = args;
    args = {};
  } else if (!cb && typeof args != 'function') {
    cb = noop;
  }

  args.ids = ids;
  this.request('get', '', args, cb);
};


/**
 * Sends a GET request for a Connection of an Object on the Graph
 *
 * @param {String}    id          The facebook users' id (or 'me').
 * @param {String}    connection  The graph connection, eg 'feed'.
 * @param {Object}    args        Any extra arguments for the querystring.
 *                                Eg, since, until, access_token, etc.
 * @param {Function}  cb          Callback function.
**/
Client.prototype.getConnection = function(id, connection, args, cb) {
  this.request('get', id + '/' + connection, args, cb);
};


/**
 * Sends a POST request to a Connection of an Object on the Graph
 *
 * @param {String}    id          The facebook users' id (or 'me').
 * @param {String}    connection  The graph connection, eg 'feed'.
 * @param {Object}    args        Any extra arguments for the querystring.
 *                                Eg, since, until, access_token, etc.
 * @param {Function}  cb          Callback function.
**/

Client.prototype.postConnection = function(id, connection, args, cb) {
  this.request('post', id + '/' + connection, args, cb);
};


/**
 * Sends a new request to facebook with the given method, path,
 * args, and triggers the cb on completion.
 *
 * @param {String}      method  The HTTP method for the request.
 * @param {String|Null} path    The path for the request, null for '/'.
 * @param {Object}      args={}    The optional arguments for the request.
 *        If the request is a POST request, args is the body of the request.
 * @param {Function}    cb      The function to call on completion.
 *        The function's signature is f(error, response, data).
**/
Client.prototype.request = function(method, path, args, cb) {
  var options = {
    host: this.host,
    port: 443,
    path: '/' + path,
    method: method.toUpperCase()
  };

  if (!cb && typeof args == 'function') {
    cb = args;
    args = {};
  } else if (!cb && typeof args != 'function') {
    cb = noop;
  }

  if (!args.access_token && this.access_token) {
    args.access_token = this.access_token;
  }

  /*
    For requests like POST where you have args like privacy, it requires
    the value to be a json string of an object, this is more easily written
    as a JS Object, and then automatically converted.

    eg.
      {
        message: 'test',
        privacy: {value: 'ALL_FRIENDS'},
        actions: {"name": "View on Zombo", "link": "http://www.zombo.com"}
      }

    would need to become:
      {
        message: 'test',
        privacy: '{"value":"ALL_FRIENDS"}',
        actions: '{"name":"View on Zombo","link":"http://www.zombo.com"}'
      }
  */

  args = formatObject(args);

  if (options.method == 'POST') {
    options.body = querystring.stringify(args);
  } else {
    options.path += '?' + querystring.stringify(args);
  }

  this._request(options, cb);
};


/**
 * Actually perform the request, this is stubbed out for testing purposes
 *
 * @param {Object}      options     The request options.
 * @param {Function}    cb          The request callback.
**/
Client.prototype._request = function(options, cb) {
  options.headers || (options.headers = {});

  if (options.body) {
    options.headers['Content-Length'] = Buffer.byteLength(options.body);
  }

  var request = https.request(options, function (response) {
    response.setEncoding('utf8');
    var data = '';

    response.on('data', function (chunk) {
      data += chunk;
    });

    response.on('end', function () {
      try {
        data = JSON.parse(data);

        if (data.error) {
          var e = new Error(data.error.message);
          e.name = data.error.type;

          cb(e, response, data);
        } else {
          cb(null, response, data);
        }
      } catch (e) {
        cb(e, response, data);
      }
    });
  });

  request.on('error', function (error) {
    cb(error);
  });

  if (options.body) {
    request.write(options.body);
  }

  request.end();
};