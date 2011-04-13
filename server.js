var fs = require('fs'),
    _ = require('underscore'),
    static = require('node-static'),
    file = new(static.Server)('./public'),
    nowjs = require('now');

var server = require('http').createServer(function(req, res){
  req.addListener('end', function() {
    file.serve(req, res);
  });
});
server.listen(process.env['NODE_ENV'] == 'development' ? 8080 : 80);

var members = [];
var everyone = nowjs.initialize(server);
var messages = [];
var message_limit = 100;

var loggedInUsers = nowjs.getGroup("loggedInUsers");
var anonymousUsers = nowjs.getGroup("anonymousUsers");

everyone.now.distributeMessage = function(message) {
  if( _.isUndefined(this.now.name) ) { return; }

  messages.push([this.now.name, message]);
  if( messages.length > message_limit ) {
    messages = messages[messages.length - message_limit-1, messages.length-1];
  }
  loggedInUsers.now.receiveMessage(this.now.name, message);
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
    this.now.kick("That name is already taken!");
    return;
  }

  _.each(messages, _.bind(function(message) {
    this.now.receiveMessage(message[0], message[1]);
  }, this));

  members.push(name || this.now.name);
  loggedInUsers.addUser(this.user.clientId);
  anonymousUsers.removeUser(this.user.clientId);

  loggedInUsers.now.systemMessage((name || this.now.name) + " connected.");
  loggedInUsers.now.updateMembers(members);
};

  
everyone.on('disconnect', function() {
  console.log("Disconnect event for " + this.user.clientId);
  var idx = members.indexOf(this.now.name);
  if( idx != -1 ) {
    members.splice(idx, 1);
  }
  loggedInUsers.removeUser(this.user.clientId);
  anonymousUsers.removeUser(this.user.clientId);

  loggedInUsers.now.systemMessage(this.now.name + " disconnected.");
  loggedInUsers.now.updateMembers(members);
});

everyone.on('connect', function() {
  anonymousUsers.addUser(this.user.clientId);
});

setInterval(function() {
  everyone.now.timestamp();
}, 60000);

