const Discord = require('discord.js');
const client = new Discord.Client(
    {intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]}
);

const config = require('./config.json');
const commands = require(`./bin/commands`);

//in case the bot was not configured properly
if(!config.prefix || !config.token) {
    console.error("Error: the configuration file was configured properly.");
    console.error("Make sure there are no spelling mistakes.");
    process.exit(1);
}

client.on('message', msg => {
    if (msg.content.startsWith(config.prefix)) {
        const commandBody = msg.content.substring(config.prefix.length).split(' ');
        const channelName = commandBody[1];
        
        if (commandBody[0] === ('record') && commandBody[1]) commands.enter(msg, channelName);
        if (commandBody[0] === ('stop')) { commands.exit(msg); commands.merge();}
    }
});

client.login(config.token);

client.on('ready', () => {
    console.log(`\nONLINE\n`);
});