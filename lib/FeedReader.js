"use strict";

var _ = require('ramda');
var feed = require('feed-read');
var fs = require('fs');
var filed = require('filed');
var Log = require('log');
var Promise = require("bluebird");

//create logger
var log = new Log('info');
var FILE_NOT_FOUND = -2;

//returns the first link from an RSS feed
var getLink = _.compose(_.prop('link'), _.head);

//checks if type is array
var isArray = _.is(Array);

//takes a new link and writes it into the cache file replacing the old value
var writeCache = _.curry(function (cacheFile, link) {
    var cache = filed(cacheFile);
    cache.write(link);
    cache.end();
    return link;
});

//returns a promise that resolves returning the content of the cache file
var readCache = function (cacheFile) {
    return new Promise(function (resolve, reject) {
        fs.readFile(cacheFile, 'utf8', function (err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    });
};


//fetch and process the feed, then resolve the promise
var fetchFeed = function (url, cache) {
    return new Promise(function (resolve, reject) {

        //takes the extracted link, checks if it's already in the cache and resolves the promise accordingly
        var processLink = function (link) {

            //writes the URl to our cache-file and resolves the Promise
            var writeAndResolve = _.compose(resolve, writeCache(cache));

            //read the cache and decide what to do with the URL depending
            //on what is in the cache
            readCache(cache).then(function (content) {
                //check if the URL was already returned once
                if (content !== link) writeAndResolve(link);
                else resolve(null);
            }).catch(function (err) {
                if (err.errno === FILE_NOT_FOUND) writeAndResolve(link);
                else reject(err);
            });

        };

        //function that is called by feed()
        var processFeed = function (err, feed) {
            //check if we could fetch the feed
            if (err || !isArray(feed) || feed.length < 1) {
                log.warning('Failed to fetch valid feed');
                reject();
                return;
            }
            //process the parsed feed
            _.compose(processLink, getLink)(feed);
        };

        //request the feed and process it
        feed(url, processFeed);

    });
};

//User facing part of the module
/**
 * Creates a new FeedReader.
 * When run it will fetch the given RSS feed, cache it and return null
 * or a new URL.
 *
 * @param url of the RSS feed
 * @param cacheFile to write
 * @constructor
 */
var FeedReader = function (url, cacheFile) {
    this.url = url;
    this.cache = cacheFile;
};

/**
 * Runs the reader and returns a Promise.
 * The Promise resolve content will be null if the first link
 * from the given RSS feed is already in the cache.
 *
 * @returns {bluebird|exports|module.exports}
 */
FeedReader.prototype.run = function () {
    return fetchFeed(this.url, this.cache);
};

/**
 * Returns the current link that is in the cache file.
 *
 * @returns {bluebird|exports|module.exports}
 */
FeedReader.prototype.getCurrentLink = function () {
    return readCache(this.cache);
};

module.exports = FeedReader;