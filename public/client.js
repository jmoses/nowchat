now.receiveMessage = function(name, message) {
  if( this.now.name == undefined ) { return; }

  addMessage("<div class=\"message\"><span class=\"name\">" + name + ":</span> "  + message + "</div>");
}

now.systemMessage = function(message) {
  addMessage('<div class="message system"><span class=\"name\">System:</span>' + message + '</div>');
}

now.timestamp = function() {
  var time = new Date();
  if( time.getMinutes() % 10 == 0 ) {
    addMessage("<div class=\"time\">" + time.getHours() % 12 + ":" + time.getMinutes() + " " + (time.getHours() > 11 ? 'pm' : 'am') + "</div>");
  }
}

now.updateMembers = function(members) {
  $('#members div').remove();

  _.each(members, function(m) {
    $('<div class="member">' + m + "</div>").appendTo($('#members'));
  });
}

now.kick = function(message) {
  $('#app').hide();
  resetApp();
  $('#kickmessage').text(message);
  $('#signin').show();
}

function addMessage(message) {
  $(message).appendTo($('#messages'));
}

function resetApp() {
  now.name = null;
  $('#messages div').remove();
}

$(function() {
  $('#send').click(function() {
    var msgText = $('#message').val();
    if( msgText == '' ) { return; }

    if( msgText.charAt(0) == '/' ) {
      now.command( msgText.substring(1));
    } else {
      now.distributeMessage($('#message').val());
    }
    $('#message').val("");
  });

  $('#message').keypress(function(evt) {
    if( evt.which == '13') {
      $('#send').click();
    }
  });

  $('#signin_form').submit(function(e) {
    e.preventDefault();

    if( $('#name').val() != '' ) {
      now.name = $('#name').val();
      $('#signin').hide();
      $('#app').show();
      now.joined(now.name);
      $('#message').focus();
    }

    return false;
  });
  
  $('#name').focus();
});
