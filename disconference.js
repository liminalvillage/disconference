'use strict';

// Setup logging
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/logs.log', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

const { wakeDyno } = require('heroku-keep-awake');

const PORT = process.env.PORT || 3000
const DYNO_URL = 'https://disconference.herokuapp.com';
const INDEX = '/logs.log';


// setup server
const express = require('express');
const { Server } = require('ws');



const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => { wakeDyno(DYNO_URL); console.log(`Listening on ${PORT}`) });

const wss = new Server({ server });

//console.log("Server listening on port " + +process.env.PORT || 1337)
wss.on('connection', (ws) => {
  //console.log('Client connected');
  ws.send(JSON.stringify(Object.assign({}, rooms)))
  //ws.on('close', () => console.log('Client disconnected'));
});

//receiving requests
// wss.on('request', function (request) {
//   i = i++;
//   connections[i] = request.accept(null, request.origin);
//   (connections[i]).on('message', function (message) {
//     // Metodo eseguito alla ricezione di un messaggio
//     if (message.type === 'utf8') {
//       // Se il messaggio è una stringa, possiamo leggerlo come segue:
//       console.log('Received mesage: ' + message.utf8Data);
//     }
//   });
//   connections[i].on('close', function (connection) {
//     // Metodo eseguito alla chiusura della connessione
//   });
// });

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
  if (newRoom && newRoom.channelID && !rooms[newRoom.channelID]) {

    rooms[newRoom.channelID] = {}

    let channel = client.channels.cache.get(newRoom.channelID)

    channel.createInvite(
      {
        //maxAge: 10 * 60 * 1000, // maximum time for the invite, in milliseconds
        //maxUses: 100 // maximum times it can be used
      },
    ).then((invite) => { rooms[newRoom.channelID].invite = invite.code });

  }

  if (oldRoom && oldRoom.channelID && rooms[oldRoom.channelID] == null) {
    rooms[oldRoom.channelID] = {}
    let channel = client.channels.cache.get(oldRoom.channelID)
    channel.createInvite(
      {
        //maxAge: 10 * 60 * 1000, // maximum time for the invite, in milliseconds
        //maxUses: 100 // maximum times it can be used
      },
    ).then((invite) => { rooms[oldRoom.channelID].invite = invite.code });
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
  message += ('"avatar": "' + oldRoom.member.user.displayAvatarURL() + '", ');
  message += ('"audio" :' + !oldRoom.member.voice.selfMute + ', ');
  message += ('"video" : ' + oldRoom.member.voice.selfVideo + ' , ');

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
      message += ('"action": "left", "roomname": "' + oldRoom.channel.name + '", "roomid": "' + oldRoom.channelID + '" ')
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
  console.log('"' + Date.now() + '": {')
  console.log('"event": {' + message + '},')
  console.log('"status": ' + JSON.stringify(Object.assign({}, rooms)))
  console.log('},')

  // communicate the room update to every (active) connection
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(Object.assign({}, rooms)))
  })
});

client.login(config.token);



//===== message based interface ============

var stats = {};
var programme = [];

function arrayRemove(arr, value) {
  return arr.filter(function (ele) {
    return ele != value;
  });
};

function printProgramme(){
  var p = "Programme: \n"
  for (var i = 0; i < programme.length; i++) {
    var d = new Date(programme[i].time)
    p += d.getHours() + ":" + d.getMinutes() + " - "
    p += programme[i].topic + " (by " + programme[i].name + ")\n"
  }
  return p
}


client.on('message', msg => {
  if (msg.content.charAt(0) === '!') {
    msg.react('👀')
      .catch(log => {
        console.log(error);
      });
  };

  if (msg.content === '!programme') {
    
    msg.channel.send(printProgramme())
      .catch(error => {
        console.log(error);
      });
  };

  if (msg.content === '!ping') {
    msg.channel.send('Pong.')
      .catch(error => {
        console.log(error);
      });
  };

  if (msg.content === '!help') {
    msg.channel.send('Disconference Commands:\n !schedule [Time] [Description] - Schedules a new even (eg: "!schedule 10:00 Yoga")\n!programme - consult the programme\n!cancel - deletes all your existing entries')
      .catch(error => {
        console.log(error);
      });
  };

  if (msg.content === '!cancel') {
    programme = programme.filter(function(element) {element.name === msg.author.username})
    msg.channel.send(printProgramme())
      .catch(error => {
        console.log(error);
      });
  };


  if (msg.content.startsWith('!schedule')) {
    // console.log(msg.content[0], msg.content[1], msg.content[3])
    var name = msg.author.username
    let time = msg.content.split(" ")[1]
    let topic = msg.content.toString().slice(msg.content.toString().indexOf(time) + (time.length + 1))
   
    var d = new Date()
    d.setHours(time.split(":")[0], time.split(":")[1])
    var o = Object()
    o.name = name
    o.topic = topic
    o.time = d.toUTCString()

    programme.push(o)

    programme = programme.sort(function (a, b) {
      return new Date(a.time) - new Date(b.time);
    })
    msg.channel.send(name + " has scheduled " + topic + " at " + time)
      .catch(error => {
        console.log(error);
      });

    msg.channel.send(printProgramme())
      .catch(error => {
        console.log(error);
      });
  }

  if (msg.content === '!stats') {
    // check if user in in table of recorded users:
    user = msg.author
    if (!(user in stats)) {
      stats[user] = {
        'interruptions': 0,
        'timeSpeaking': 0,
      };
      msg.channel.send('it seems like you haven\'t participated in a VC debate with me yet!')
        .catch(error => {
          console.log(error);
        });
    } else {
      let interruptions = stats[user]['interruptions'];
      let timeSpeaking = stats[user]['timeSpeaking'];
      msg.channel.send(`You've spoken in VC a total of ${timeSpeaking} minutes \nYou've interrupted others a total of ${interruptions} times.`)
        .catch(error => {
          console.log(error);
        });
    };
  };

  if (msg.content === '!debate') {

    if (!msg.guild) {
      msg.channel.send('You\'re currently not in a guild!');
      return;
    };

    msg.channel.send('Please wait a moment while I connect to the VC.')
      .catch(error => {
        console.log(error);
      });

    const channel = msg.member.voiceChannel
    if (channel === undefined) {
      msg.channel.send('It seems like you\'re not in a VC.');
      return
    };

    channel.join()
      .then(connection => {
        msg.channel.send('Success! I\'m now connected and ready to listen.');
        var speakers = [];
        connection.on('speaking', (user, speaking) => {
          // when a user starts speaking:
          if (speaking) {
            // add them to the list of speakers
            // start a timer recording how long they're speaking
            speakers.push({ user: new Date().getTime() });
            // check for interruptions
            if (user in stats) {
              if (speakers.length > 1) {
                stats[user][interruptions] = stats[user]['interruptions'] + 1;
              };
            } else {
              stats[user] = {
                'interruptions': 0,
                'timeSpeaking': 0,
              };
            };
            // when a user stops speaking:
          } else {
            // stop the timer and add it to their total time
            var talkTime = (new Date().getTime()) - (stats[user]['timeSpeaking']);
            var talkTime = talkTime / 1000;
            var talkTime = Math.abs(talkTime);

            if (user in stats) {
              stats[user]['timeSpeaking'] = stats[user]['timeSpeaking'] + talkTime;
            } else {
              stats[user] = {
                'interruptions': 0,
                'timeSpeaking': talkTime,
              };
            };
            // remove them from the list of speakers
            if (speakers.includes(user)) {
              arrayRemove(speakers, user)
            };
          };
        });
        connection.on('disconnect', () => {
          msg.channel.send('I was disconnected ⁉️.')
            .catch(error => {
              console.log(error);
            });
        })
        // when a user leaves the VC:
        //     remove them from the list of speakers
        //     stop the timer and add it to their total time 
      })
      .catch(error => {
        console.log(error);
        msg.channel.send('I couldn\'t connect to the VC 🤔.');
        msg.channel.send('(The VPS this is running on probably doesn\'t have the FFMPEG library installed, TBH.)')
      });
  };
});