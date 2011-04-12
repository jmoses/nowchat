var fs = require('fs'),
    _ = require('underscore'),
    static = require('node-static'),
    file = new(static.Server)('./public');

var server = require('http').createServer(function(req, res){
  req.addListener('end', function() {
    file.serve(req, res);
  });
});
server.listen(process.env['NODE_ENV'] == 'development' ? 8080 : 80);

var members = [];
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
      this.now.systemMessage('Time');
      break;
    default:
      this.now.systemMessage('Huh??');
      break;
  }
}

everyone.now.joined = function(name) {
  if( _.indexOf(members, name) != -1 ) {
    this.now.systemMessage("That name is already taken.");
    this.now.kick();
    return;
  }

  _.each(messages, _.bind(function(message) {
    this.now.receiveMessage(message[0], message[1]);
  }, this));

  members.push(name || this.now.name);
  everyone.now.systemMessage((name || this.now.name) + " connected.");
  everyone.now.updateMembers(members);
};

everyone.disconnected = function() {
  var idx = members.indexOf(this.now.name);
  if( idx != -1 ) {
    members.splice(idx, 1);
  }
  everyone.now.systemMessage(this.now.name + " disconnected.");
  everyone.now.updateMembers(members);
}

setInterval(function() {
  everyone.now.timestamp();
}, 60000);

