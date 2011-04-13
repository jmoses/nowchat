var fs = require('fs'),
    _ = require('underscore'),
    static = require('node-static'),
    file = new(static.Server)('./public'),
    nowjs = require('now'),
    redis = require('redis');

var server = require('http').createServer(function(req, res){
  req.addListener('end', function() {
    file.serve(req, res);
  });
});
server.listen(process.env['NODE_ENV'] == 'development' ? 8080 : 80);

var members = [];
var everyone = nowjs.initialize(server);
var message_limit = 100;

var redisClient = redis.createClient();
redisClient.on("error", function(err) {
  console.log("Error " + err);
});

var globalRoomKey = "chatty:rooms:global";

function pushMessage(name, message) {
  console.log("Pushing message to redis from " + name + ": " + message );
  redisClient.lpush(globalRoomKey, JSON.stringify([name, message]), trimMessages );
}

function trimMessages() {
  console.log("Trimming redis messages");
  redisClient.ltrim(globalRoomKey, 0, message_limit)
}

function getMessages(callback) {
  redisClient.lrange(globalRoomKey, 0, -1, callback)
}

var loggedInUsers = nowjs.getGroup("loggedInUsers");
var anonymousUsers = nowjs.getGroup("anonymousUsers");

everyone.now.distributeMessage = function(message) {
  if( _.isUndefined(this.now.name) ) { return; }

  pushMessage(this.now.name, message);
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

  getMessages(_.bind(function(err, replies) {
    console.log("Got messages from redis on join: " + messages);
    if( replies == null || replies == undefined ) { return; };
    var messages = _.map(replies, function(reply) { return JSON.parse(reply); } );

    _.each(messages.reverse(), _.bind(function(message) {

      this.receiveMessage(message[0], message[1]);
    }, this));
  }, this.now));

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

