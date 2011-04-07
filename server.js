// Change for git
var fs = require('fs'),
    _ = require('underscore'),
    static = require('node-static'),
    file = new(static.Server)('./public');

var server = require('http').createServer(function(req, res){
  req.addListener('end', function() {
    file.serve(req, res);
  });
});
server.listen(8080);

var everyone = require('now').initialize(server);
var messages = [];
var message_limit = 100;

everyone.now.distributeMessage = function(message) {
  if( _.isUndefined(this.now.name) ) { return; }

  messages.push([this.now.name, message]);
  if( messages.length > message_limit ) {
    messages = messages[messages.length - message_limit-1, messages.length-1];
  }
  everyone.now.receiveMessage(this.now.name, message);
};

everyone.now.command = function(command) {
  switch(command) {
    case 'time':
      this.now.receiveMessage('System', 'Time');
      break;
    default:
      this.now.receiveMessage('System', 'Huh??');
      break;
  }
}

everyone.now.joined = function(name) {
  _.each(messages, _.bind(function(message) {
    this.now.receiveMessage(message[0], message[1]);
  }, this));
  this.now.receiveMessage("System", "Welcome, " + (name || this.now.name));
};

setInterval(function() {
  everyone.now.timestamp();
}, 60000);

