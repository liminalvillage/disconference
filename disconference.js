'use strict';

// Setup logging
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/logs.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

// setup server
const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/logs.log';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

//console.log("Server listening on port " + +process.env.PORT || 1337)
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

//receiving requests
wss.on('request', function (request) {
  i = i++;
  connections[i] = request.accept(null, request.origin);
  (connections[i]).on('message', function (message) {
    // Metodo eseguito alla ricezione di un messaggio
    if (message.type === 'utf8') {
      // Se il messaggio è una stringa, possiamo leggerlo come segue:
      console.log('Received mesage: ' + message.utf8Data);
    }
  });
  connections[i].on('close', function (connection) {
    // Metodo eseguito alla chiusura della connessione
  });
});

/*
 DISCORD.JS VERSION 12 CODE
*/
// Load up the discord.js library
const Discord = require("discord.js");

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

// client.channels.get(rooms[0]).on('speaking', (user, speaking) => {
//   console.log(user)
// })

client.on('voiceStateUpdate', (oldRoom, newRoom) => {
  let participant = {}
  participant.name = oldRoom.member.displayName
  participant.avatar = oldRoom.member.user.displayAvatarURL()
  participant.audio = !oldRoom.member.voice.selfMute
  participant.video = oldRoom.member.voice.selfVideo

  //create new room  if it doesn't exist
  if (newRoom  && newRoom.channelID && !rooms[newRoom.channelID])
  {

    rooms[newRoom.channelID] = {}

    let channel = client.channels.cache.get(newRoom.channelID)

    channel.createInvite(
      {
        //maxAge: 10 * 60 * 1000, // maximum time for the invite, in milliseconds
        //maxUses: 100 // maximum times it can be used
      },
    ).then( (invite)=>{rooms[newRoom.channelID].invite = invite.code});
 
  }

  if (oldRoom && oldRoom.channelID && rooms[oldRoom.channelID] == null)
  {
    rooms[oldRoom.channelID] = {}
    let channel = client.channels.cache.get(oldRoom.channelID)
    channel.createInvite(
      {
        //maxAge: 10 * 60 * 1000, // maximum time for the invite, in milliseconds
        //maxUses: 100 // maximum times it can be used
      },
    ).then( (invite)=>{rooms[oldRoom.channelID].invite = invite.code});
  }

  //update room names
  if (newRoom.channelID)
    rooms[newRoom.channelID].name = newRoom.channel.name
  if (oldRoom.channelID)
    rooms[oldRoom.channelID].name = oldRoom.channel.name


  //create participants list if it doesn't exist
  if (newRoom.channelID)
  if (!rooms[newRoom.channelID].participants)
    rooms[newRoom.channelID].participants = []

  if (oldRoom.channelID)
  if (!rooms[oldRoom.channelID].participants)
    rooms[oldRoom.channelID].participants = []


  // Create info
  let message = ""
  message += ('"name" : "' + oldRoom.member.displayName + '", ');
  message += ('"avatar": "' + oldRoom.member.user.displayAvatarURL()+ '", ');
  message += ('"audio" :' + !oldRoom.member.voice.selfMute+ ', ');
  message += ('"video" : ' + oldRoom.member.voice.selfVideo+ ' , ');

  if (oldRoom.channelID == newRoom.channelID) // A/V status change
  {
    rooms[newRoom.channelID].participants = rooms[newRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
    rooms[newRoom.channelID].participants.push(participant)
  }
  else //Room change
  {
    if (oldRoom.channelID == null) //user joined
    {
      message += ('"action": "joined", "roomname" : "' + newRoom.channel.name + '", "roomid": "' + newRoom.channelID + '" ')
      rooms[newRoom.channelID].participants.push(participant)

    }
    else if (newRoom.channelID == null) //user left
    {
      message += ('"action": "left", "roomname": "' + oldRoom.channel.name + '", "roomid": "' + oldRoom.channelID +'" ')
      rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))

    }
    if (oldRoom.channelID != null && newRoom.channelID != null) { // user moved
      {
        message += ('"action": "moved", "fromroomname": "' + oldRoom.channel.name + '", "frommroomid": "' + oldRoom.channelID + '", "toroomname": "' + newRoom.channel.name + '", "toroomid": "' + newRoom.channelID + '" ')
        rooms[newRoom.channelID].participants.push(participant)
        rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
      }
    }
  }

  //console.log(message)
  console.log('"'+ Date.now() + '": {')
  console.log('"event": {' + message + '},')
  console.log('"status": '+JSON.stringify(Object.assign({}, rooms)))
  console.log('},')
  // communicate the room update to every (active) connection
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(Object.assign({}, rooms)))
  })
});

client.login(config.token);