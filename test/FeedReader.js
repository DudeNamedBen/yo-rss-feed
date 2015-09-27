var expect = require('chai').expect;
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var fs = require('fs');
var should = require('chai').should();
var FeedReader = require('../lib/FeedReader');

var cache = 'testing.cache.tmp';
var feed = 'http://feeds.feedburner.com/satwcomic';

process.chdir('./test');
try {
    fs.unlinkSync(cache);
} catch (e) {
    //file not found
}

var reader = new FeedReader(feed, cache);

describe("FeedReader", function () {

    it("should reject Promise", function () {
        return reader.getCurrentLink().should.eventually.be.rejected;
    });

    it("should fetch RSS feed and return link", function () {
        return reader.run().should.eventually.be.a('string');
    });

    it("should fetch RSS feed and return null", function () {
        return reader.run().should.eventually.equal(null);
    });

    it("should return cached link", function () {
        return reader.getCurrentLink().should.eventually.be.a('string');
    });

});
