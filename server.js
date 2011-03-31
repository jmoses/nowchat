var fs = require('fs'),
    _ = require('underscore');

var server = require('http').createServer(function(req, response){
  fs.readFile('index.html', function(err, data){
    response.writeHead(200, {'Content-Type':'text/html'}); 
    response.write(data);  
    response.end();
  });
});
server.listen(8080);

var everyone = require('now').initialize(server);
var messages = [];
var message_limit = 100;

everyone.now.distributeMessage = function(message) {
  messages.push([this.now.name, message]);
  if( messages.length > message_limit ) {
    messages = messages[messages.length - message_limit-1, messages.length-1];
  }
  everyone.now.receiveMessage(this.now.name, message);
};

everyone.now.joined = function() {
  _.each(messages, _.bind(function(message) {
    this.now.receiveMessage(message[0], message[1]);
  }, this));
  this.now.receiveMessage("System", "Welcome, " + this.now.name);
};

setInterval(function() {
  everyone.now.timestamp();
}, 60000);

