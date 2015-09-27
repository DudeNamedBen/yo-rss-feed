var expect = require('chai').expect;
var supertest = require('supertest');
var app = require('../App');

describe("App", function() {

    it("returns INVALID_USERNAME on /webhook?username=all", function(done) {
        supertest(app).get('/webhook?username=all')
            .expect(200, 'INVALID_USERNAME', done);
    });

    //please note that FEEDREADER is actually a valid account owned by me
    //so that no one accidentally gets spammed
    it("returns OK on /webhook?username=FEEDREADER", function(done) {
        supertest(app).get('/webhook?username=FEEDREADER')
            .expect(200, 'OK', done);
    });

});