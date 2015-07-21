var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var redis   = require('redis');


// Redis publisher
var publisher = redis.createClient();

// Sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sockjs_doc = sockjs.createServer(sockjs_opts);
sockjs_doc.on('connection', function(conn) {
    var browser = redis.createClient();
    browser.subscribe('doc_channel');
    //reading from the channel
	console.log("reading the already made doc");
	//reading the already created doc
	var docText=publisher.get("docText", function(err,res) {
    if (err) throw err;
    publisher.publish('doc_channel', res);
});
	console.log(docText);
    // When we see a message on doc_channel, send it to the browser
    browser.on("message", function(channel, message){
        conn.write(message);
        
        publisher.set("docText",message, function(err) {
    if (err) throw err;
});
        
        
        
    });

    // When we receive a message from browser, send it to be published
    conn.on('data', function(message) {
        publisher.publish('doc_channel', message);
    });
});

// Express server
var app = express();
var server = http.createServer(app);

sockjs_doc.installHandlers(server, {prefix:'/doc'});

console.log(' [*] Listening on 0.0.0.0:9001' );
server.listen(9001, '0.0.0.0');

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});