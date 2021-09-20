
'use strict';

const { ApolloServer, gql } = require('apollo-server');
var fs = require('fs');
// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  
  type Participant{
    name : String
    avatar: String
    attendance: Float
    jumps: Int
  }
  type Event {
    time: Float
    name : String
    avatar : String
    audio : Boolean
    video : Boolean
    action : String
    roomname: String
    roomid: String
    toroomname: String
    toroomid: String
  }

  type Room
  {
     name : String
     id: String
     participants : [Event]
     invite : String
     server : String
  }

  type Status{
    time: String
    event: Event
    rooms: [Room]
  }

  type Item{
    name: String
    topic: String
    time: String
    server: String
  }
 
  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    allevents: [Status]
    events (name: String!): [Event]
    db: [Status]
    latest: Status
    programme: [Item]
  }
`;


var db = []
var programme = [];
var latest ={}

//loads old data if it exists
try {
  if (fs.existsSync(__dirname + '/db.json')) {
    //file exists
    db =  JSON.parse(fs.readFileSync(__dirname + '/db.json'));
    latest = db[db.length-1]
    console.log(db)
  }
} catch(err) {
  //do nothinng
}
try {
  if (fs.existsSync(__dirname + '/programme.json')) {
    //file exists
    programme =  JSON.parse(fs.readFileSync(__dirname + '/programme.json'));
    console.log(programme)
  }
} catch(err) {
  //do nothinng
}


// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    latest: () => latest,
    db : ()=> db,
    allevents: () => db,
    events (parent, args, context, info) {
      const { name } = args;
      var statuses = db.filter((a) => name.includes(a.event.name))
      return  statuses.map((a) => a.event) 
    },
    programme:() => programme
  }
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const apolloserver = new ApolloServer({cors: {origin: '*',credentials: true }, typeDefs, resolvers });

// The `listen` method launches a web server.
apolloserver.listen().then(({ url }) => {
  console.log(`🚀 GraphQL Server ready at ${url}`);
});



// Setup logging
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/logs.log', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

// const { wakeDyno } = require('heroku-keep-awake');
// const DYNO_URL = 'https://disconference.herokuapp.com';

const PORT = process.env.PORT || 3000

const INDEX = '/logs.log';

// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client( 
  {intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]}
);

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const commands = require(`./recordercommands`);

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

function filterByParticipant(item, id) {
  if (item.id == id) {
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
  participant.name = escape(oldRoom.member.displayName)
  participant.id = oldRoom.member.id
  participant.avatar = oldRoom.member.user.displayAvatarURL()
  participant.audio = !oldRoom.member.voice.selfMute
  participant.video = oldRoom.member.voice.selfVideo

  //create new room  if it doesn't exist
  if (newRoom && newRoom.channelID && !rooms[newRoom.channelID]) {

    rooms[newRoom.channelID] = {}
    rooms[newRoom.channelID].id = newRoom.channelID
    rooms[newRoom.channelID].server = newRoom.guild.id
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
    rooms[oldRoom.channelID].id = oldRoom.channelID
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
  message += '"time" : ' + Date.now() + ',';
  message += ('"name" : "' + escape(oldRoom.member.displayName) + '", ');
  message += ('"avatar": "' + oldRoom.member.user.displayAvatarURL() + '", ');
  message += ('"audio" :' + !oldRoom.member.voice.selfMute + ', ');
  message += ('"video" : ' + oldRoom.member.voice.selfVideo + ' , ');

  if (oldRoom.channelID == newRoom.channelID) // A/V status change
  {
    message += ('"action": "avchange", "roomname" : "' + escape(oldRoom.channel.name) + '", "roomid": "' + oldRoom.channelID + '" ')
    rooms[newRoom.channelID].participants = rooms[newRoom.channelID].participants.filter(item => filterByParticipant(item, participant.id))
    rooms[newRoom.channelID].participants.push(participant)
  }
  else //Room change
  {
    if (oldRoom.channelID == null) //user joined
    {
      message += ('"action": "joined", "roomname" : "' + escape(newRoom.channel.name) + '", "roomid": "' + newRoom.channelID + '" ')
      rooms[newRoom.channelID].participants.push(participant)

    }
    else if (newRoom.channelID == null) //user left
    {
      message += ('"action": "left", "roomname": "' + escape(oldRoom.channel.name) + '", "roomid": "' + oldRoom.channelID + '" ')
      rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.id))

    }
    if (oldRoom.channelID != null && newRoom.channelID != null) { // user moved
      {
        message += ('"action": "moved", "roomname": "' + escape(oldRoom.channel.name) + '", "roomid": "' + oldRoom.channelID + '", "toroomname": "' + escape(newRoom.channel.name) + '", "toroomid": "' + newRoom.channelID + '" ')
        rooms[newRoom.channelID].participants.push(participant)
        rooms[oldRoom.channelID].participants = rooms[oldRoom.channelID].participants.filter(item => filterByParticipant(item, participant.id))
      }
    }
  }

  var payload = ""
  payload += ('{')
  payload +=('"time": ' + Date.now() + ',')
  payload +=('"event": {' + message + '},')
  payload +=('"rooms": ' + JSON.stringify(Object.values(rooms)))
  payload +=('}')

  latest = JSON.parse(payload)
  db.push(latest) 
  console.log(payload + ',');

  // console.log('{')
  // console.log('"time": ' + Date.now() + ',')
  // console.log('"event": {' + message + '},')
  // console.log('"rooms": ' + JSON.stringify(Object.values(rooms)))
  // console.log('},')
});

client.login(config.token);



//===== message based interface ============

var stats = {};

function arrayRemove(arr, value) {
  return arr.filter(function (ele) {
    return ele != value;
  });
};

function printProgramme(){
  var p = "Programme: \n"
  for (var i = 0; i < programme.length; i++) {
    var d = new Date(programme[i].time)
    p += d.toTimeString().slice(0,5) + " - "
    p += programme[i].topic + " by " + programme[i].name + " (On " + programme[i].server +" server )\n"
  }
  return p
}


client.on('message', msg => {
  if (msg.content.charAt(0) === config.prefix) {
    msg.react('👀')
      .catch(log => {
        console.log(error);
      });
  };
  const commandBody = msg.content.substring(config.prefix.length).split(' ');
    
  // if (msg.content.startsWith(config.prefix)) {
    
  // if (commandBody[0] === ('record') && commandBody[1]) 
  //   commands.enter(msg, commandBody[1]);

  // if (commandBody[0] === ('stop')) { 
  //   commands.exit(msg); 
  //   commands.merge(msg);
  // }


  if (commandBody[0] === 'programme') {
    
    msg.channel.send(printProgramme())
      .catch(error => {
        console.log(error);
      });
  };

  if (commandBody[0] === 'ping') {
    msg.channel.send('Pong.')
      .catch(error => {
        console.log(error);
      });
  };

  if (commandBody[0] === 'help') {
    msg.channel.send('Disconference Commands:\n !schedule [Time] [Description] - Schedules a new event in your timezone (eg: "!schedule 10:00 Yoga")\n!programme - consult the programme\n!cancel - deletes all your existing entries')
      .catch(error => {
        console.log(error);
      });
  };

  if (commandBody[0] ==='cancel') {
    programme = programme.filter(function(element) {element.name === msg.author.username})
    msg.channel.send(printProgramme())
      .catch(error => {
        console.log(error);
      });
  };

  if (commandBody[0] ==='restart') {
    var d = new Date();
    fs.writeFile(__dirname + '/db/db_'+ d.toTimeString() + '.json',  JSON.stringify(db), function(err) {
      if (err) {
          console.log(err);
      }
    });
    fs.writeFile(__dirname + '/db/programme_'+ d.toTimeString() + '.json',  JSON.stringify(programme), function(err) {
      if (err) {
          console.log(err);
      }
    });
    db = []
    programme =[]
  };



  if (commandBody[0] === 'schedule') {
    var name = msg.author.username
    var time
    if (commandBody[1]) {
     time =  commandBody[1]
    }
    if (!commandBody[1] || !time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)){
      msg.channel.send("Wrong time format! Usage example: !schedule 10:00 Yoga ")
      .catch(error => {
        console.log(error);
      }); 
      return 
    }
  
    
    let topic = msg.content.toString().slice(msg.content.toString().indexOf(time) + (time.length + 1))
   
    var d = new Date()
    d.setHours(time.split(":")[0])
    d.setMinutes(time.split(":")[1])
    var o = Object()
    o.name = name
    o.topic = topic
    o.time = d.toUTCString()
    o.server = msg.guild.toString()

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

  if (commandBody[0] === 'stats') {
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

  if (commandBody[0] === 'debate') {

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