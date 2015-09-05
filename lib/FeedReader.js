var _ = require('ramda');
var feed = require('feed-read');
var moment = require('moment');
var fs = require('fs');
var filed = require('filed');
var concat = require('concat-stream');
var StringDecoder = require('string_decoder').StringDecoder;
let Log = require('log');
var Promise = require("bluebird");

//create logger
var log = new Log('info');
const FILE_NOT_FOUND = -2;

//returns the first link from an RSS feed
var getLink = _.compose(_.prop('link'), _.head);

//takes a new link and writes it into the cache file replacing the old value
var writeCache = _.curry((cacheFile, link) => {
    let cache = filed(cacheFile);
    cache.write(link);
    cache.end();
    return link;
});

//returns a promise that resolves returning the content of the cache file
var readCache = (cacheFile) => {
    return new Promise((resolve, reject) => {
        let streamReceiver = (cache) => {
            var decoder = new StringDecoder();
            var content = decoder.write(cache);
            resolve(content);
        };
        let stream = fs.createReadStream(cacheFile);
        stream.pipe(concat(streamReceiver));
        stream.on('error', (err) => reject(err));
    });
};

//fetch and process the feed, then resolve the promise
var fetchFeed = (resolve, reject, url, cache) => {
    feed(url, (err, feed) => {

        //check if we can fetch the feed
        if (err) {
            log.warning('Failed to fetch feed @%s', moment().format('YYYY-DD-MM HH:mm:ss'));
            reject();
        }

        //takes the extracted link, checks if it's already in the cache and resolves the promise accordingly
        let processLink = (link) => {
            let writeAndResolve = _.compose(resolve, writeCache(cache));
            readCache(cache).then((content) => {
                (content !== link)? writeAndResolve(link) : resolve(null);
            }).catch((err) => {
                if(err.errno === FILE_NOT_FOUND) writeAndResolve(link);
                else reject(err);
            });
        };

        //process the parsed feed
        _.compose(processLink, getLink)(feed);

    });
};

//User facing part of the module
/**
 * Creates a new FeedReader.
 *
 * @param url of the RSS feed
 * @param cachefile to write
 * @constructor
 */
let FeedReader = function (url, cachefile) {
    this.url = url;
    this.cache = cachefile;
};

/**
 * Runs the reader and returns a Promise.
 * The Promise resolve content will be null if the first link from the given RSS feed is already in the cache!
 *
 * @returns {bluebird|exports|module.exports}
 */
FeedReader.prototype.run = function () {
    return new Promise((resolve, reject) => fetchFeed(resolve, reject, this.url, this.cache));
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