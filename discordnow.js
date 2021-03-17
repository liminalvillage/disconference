// Load up server and api libraries
var app = require('express')();
var http = require('http');
var WebSocketServer = require('websocket').server;

app.get('/', function(req, res) {
   res.sendFile('index.html');
});

// Load up the discord.js library
const Discord = require("discord.js");

let now = {}
let wsServer
let connections = {}
let i = 0

app.get('/', function(req, res) {
   res.sendFile('index.html');
});


  var server = http.createServer(function(request, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
  });
  server.listen(process.env.PORT || 1337, "0.0.0.0" , function() { });
// Creazione del server
wsServer = new WebSocketServer({
    httpServer: server
});
// Gestione degli eventi
wsServer.on('request', function(request) {
    i = i++;
    connections[i] = request.accept(null, request.origin);
    (connections[i]).on('message', function(message) {
        // Metodo eseguito alla ricezione di un messaggio
        if (message.type === 'utf8') {
            // Se il messaggio è una stringa, possiamo leggerlo come segue:
            console.log('Received mesage: ' + message.utf8Data);
        }
    });
    connections[i].on('close', function(connection) {
        // Metodo eseguito alla chiusura della connessione
    });
});

/*
 DISCORD.JS VERSION 12 CODE
*/


// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

function filterByParticipant(item, name) {
  if (item.name == name) {
    return false
  }
  return true;
}



var rooms = []; // empty Array, which you can push() values into


client.on('voiceStateUpdate', (oldRoom, newRoom) => {
      let participant = {}
      participant.name = oldRoom.member.displayName
      participant.avatar = oldRoom.member.user.displayAvatarURL()
      participant.audio = !oldRoom.member.voice.selfMute
      participant.video = oldRoom.member.voice.selfVideo
      

      //create new room  if it doesn't exist
      if (!rooms[newRoom.channelID] )
      rooms[newRoom.channelID] = {}

      if (!rooms[oldRoom.channelID] ) 
        rooms[oldRoom.channelID] = {}

      //create participant room  if it doesn't exist
      if (!rooms[newRoom.channelID].participants )
        rooms[newRoom.channelID].participants = []

      if (!rooms[oldRoom.channelID].participants ) 
        rooms[oldRoom.channelID].participants = []

      //update room name

      rooms[newRoom.channelID].name = newRoom.channel.name
      rooms[oldRoom.channelID].name = oldRoom.channel.name

      // Create info
      let message = ""
      message += ( "\nName: " + oldRoom.member.displayName);
      message += ( "\nAvatar: " + oldRoom.member.user.displayAvatarURL());
      
      if (oldRoom.channelID == newRoom.channelID) // A/V status change
      { 
        rooms[newRoom.channelID].participants = rooms[newRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
        rooms[newRoom.channelID].participants.push(participant)
      }
      else //Room change
      {
        if (oldRoom.channelID == null) //user joined
        {  
          message = message + ("\nJoined: " + newRoom.channel.name + " (" + newRoom.channelID + ")");
          rooms[newRoom.channelID].participants.push(participant)

        }
        else if (newRoom.channelID == null) //user left
        {  
          message = message + ("\nLeft: from " + oldRoom.channel.name + " (" + oldRoom.channelID + ")");
          rooms[oldRoom.channelID].participants = room[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
  
        }
        if (oldRoom.channelID != null && newRoom.channelID != null){ // user moved
        {
          message = message + ("\nMoved: from " + oldRoom.channel.name + " (" + oldRoom.channelID + ") to " + newRoom.channel.name + " (" + newRoom.channelID + ")");
          
          rooms[newRoom.channelID].participants.push(participant)
          rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
        }
      }
    }

    console.log (message)
    console.log(rooms)

    // communicate the room update to every (active) connection
    for (counter = 0; counter <= i; counter++) 
    {
        connections[counter]?.send(JSON.stringify(Object.assign({}, rooms))) 
    }
});

client.login(config.token);

//utilities

// if (!Array.prototype.filter){
//   Array.prototype.filter = function(func, thisArg) {
//     'use strict';
//     if ( ! ((typeof func === 'Function' || typeof func === 'function') && this) )
//         throw new TypeError();

//     var len = this.length >>> 0,
//         res = new Array(len), // preallocate array
//         t = this, c = 0, i = -1;

//     var kValue;
//     if (thisArg === undefined){
//       while (++i !== len){
//         // checks to see if the key was set
//         if (i in this){
//           kValue = t[i]; // in case t is changed in callback
//           if (func(t[i], i, t)){
//             res[c++] = kValue;
//           }
//         }
//       }
//     }
//     else{
//       while (++i !== len){
//         // checks to see if the key was set
//         if (i in this){
//           kValue = t[i];
//           if (func.call(thisArg, t[i], i, t)){
//             res[c++] = kValue;
//           }
//         }
//       }
//     }

//     res.length = c; // shrink down array to proper size
//     return res;
//   };
// }


function arrayToJSONObject (arr){
  //header
  var keys = arr[0];

  //vacate keys from main array
  var newArr = arr.slice(1, arr.length);

  var formatted = [],
  data = newArr,
  cols = keys,
  l = cols.length;
  for (var i=0; i<data.length; i++) {
          var d = data[i],
                  o = {};
          for (var j=0; j<l; j++)
                  o[cols[j]] = d[j];
          formatted.push(o);
  }
  return formatted;
}