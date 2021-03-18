'use strict';
// setup server
const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

// Load up the discord.js library
const Discord = require("discord.js");

//console.log("Server listening on port " + +process.env.PORT || 1337)
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Gestione degli eventi
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
  if (newRoom != null && !rooms[newRoom.channelID])
    rooms[newRoom.channelID] = {}

  if (oldRoom != null && !rooms[oldRoom.channelID])
    rooms[oldRoom.channelID] = {}

  //update room names
  if (newRoom.channel != null)
    rooms[newRoom.channelID].name = newRoom.channel.name
  if (oldRoom.channel != null)
    rooms[oldRoom.channelID].name = oldRoom.channel.name


  //create participant room  if it doesn't exist
  if (!rooms[newRoom.channelID].participants)
    rooms[newRoom.channelID].participants = []

  if (!rooms[oldRoom.channelID].participants)
    rooms[oldRoom.channelID].participants = []


  // Create info
  let message = ""
  message += ("\nName: " + oldRoom.member.displayName);
  message += ("\nAvatar: " + oldRoom.member.user.displayAvatarURL());
  message += ("\Audio: " + !oldRoom.member.voice.selfMute);
  message += ("\nAvatar: " + oldRoom.member.voice.selfVideo);

  if (oldRoom.channelID == newRoom.channelID) // A/V status change
  {
    rooms[newRoom.channelID].participants = rooms[newRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
    rooms[newRoom.channelID].participants.push(participant)
  }
  else //Room change
  {
    if (oldRoom.channelID == null) //user joined
    {
      message += ("\nJoined: " + newRoom.channel.name + " (" + newRoom.channelID + ")");
      rooms[newRoom.channelID].participants.push(participant)

    }
    else if (newRoom.channelID == null) //user left
    {
      message += ("\nLeft: from " + oldRoom.channel.name + " (" + oldRoom.channelID + ")");
      rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))

    }
    if (oldRoom.channelID != null && newRoom.channelID != null) { // user moved
      {
        message += ("\nMoved: from " + oldRoom.channel.name + " (" + oldRoom.channelID + ") to " + newRoom.channel.name + " (" + newRoom.channelID + ")");

        rooms[newRoom.channelID].participants.push(participant)
        rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.name))
      }
    }
  }

  console.log(message)
  console.log(rooms)

  // communicate the room update to every (active) connection
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(Object.assign({}, rooms)))
  })
});

client.login(config.token);