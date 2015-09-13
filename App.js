////////////////////////////////////////////////////////////////////
//Warning: Do not run this file directly, run Bootstrap.js instead!/
////////////////////////////////////////////////////////////////////

var nconf = require('nconf');
var express = require('express');
var FeedReader = require('./lib/FeedReader');

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
var execReader = () => {
    reader.run().then((link) => {
        if(link !== null) {
            console.log(`Sending link ${link} to subscribers...`);
            yo('all', link);
        }
    }).catch((err) => console.log(err));
};

//schedule FeedReader execution
let minutes = nconf.get('update-interval');
setInterval(execReader, (minutes * 60 * 1000));
execReader();

//listen for YOs
var app = express();
var port = nconf.get('http:port');
var route = nconf.get('http:endpoint');

app.get(route, (req, resp) => {
    let username = req.query.username;
    if (typeof username === 'string' && username !== 'all') {
        reader.getCurrentLink()
            .then((link) => yo(username, link))
            .catch((err) => console.log(err));
        resp.send('OK');
    } else {
        resp.send('INVALID USERNAME');
    }
});

app.listen(port, () => console.log(`App is listening on port ${port}`));