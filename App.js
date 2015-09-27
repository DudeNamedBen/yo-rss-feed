"use strict";

var nconf = require('nconf');
var express = require('express');
var Log = require('log');
var FeedReader = require('./lib/FeedReader');

//create logger
var log = new Log('info');

//load configuration
nconf.argv()
    .env()
    .file({file: 'config.json'})
    .defaults({
        'api-key': null,
        'update-interval': '120', //minutes
        'feed-url': 'http://feeds.feedburner.com/satwcomic',
        'cache-file': __dirname + '/application.cache',
        'http': {
            'port': 30000,
            'endpoint': '/webhook'
        }
    });

//setup yo API
var yo = require('yo-api2')(nconf.get('api-key'));

//feed reader
var reader = new FeedReader(nconf.get('feed-url'), nconf.get('cache-file'));

//run the FeedReader and yo all subscribers
var execReader = function () {
    reader.run().then(function (link) {
        if (link !== null) {
            log.info('Sending link ' + link + ' to subscribers...');
            yo('all', link);
        }
    }).catch(function (err) {
        log.error(err);
    });
};

//schedule FeedReader execution
var minutes = nconf.get('update-interval');
setInterval(execReader, (minutes * 60 * 1000));
execReader();

//listen for YOs
var app = express();
var port = nconf.get('http:port');
var route = nconf.get('http:endpoint');

app.get(route, function (req, resp) {
    var username = req.query.username;
    if (typeof username === 'string' && username !== 'all') {
        reader.getCurrentLink()
            .then(function (link) {
                log.info("Direct link requested from: " + username);
                yo(username, link);
            }).catch(function (err) {
                log.error(err);
            });
        resp.send('OK');
    } else {
        resp.send('INVALID_USERNAME');
    }
});

app.listen(port, function () {
    log.info('App is listening on port ' + port);
});

module.exports = app;