import 'dotenv/config';
import { ActivityType } from 'discord.js';
import { execute } from './ai.js';  // Import the AI module

import { client } from './components/purpleClient.js'; // set up client object and login


// on ready
client.once('clientReady', () => {
    console.log('Purple is online!');

    client.user.setPresence({
        activities: [{ name: `with your heart`, type: ActivityType.Playing }],
        status: 'online',
    });

    // run cron jobs
    import('./cron-jobs.js');
});


// WATCHERS
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Developer only commands
import { Campaigns } from "./config/campaigns.js"; // grab campaign data

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Check if the bot is mentioned in the message
    if (message.mentions.has(client.user)) {
        const request = message.content.replace(`<@${client.user.id}>`, '').trim();
        if (request.length > 0) {
            console.log(`🤔 Thinking of a response...`);
            message.channel.sendTyping();
            // Call the AI function from ai.js
            execute(request, message)
                .then(r => {
                    message.reply(r);
                });
        }
    }

    const prefix = "!p";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!process.env.DEV_ID == message.author.id) {
        return message.reply('You do not have permission to use this command.');
    } else {
        console.log(`[DEV] ${command} command execute | user => ${message.author.username}`);
    }

    if (command === 'run') {
        if (message.guild)
            message.delete();

        try {
            message.channel.send(`beep: ${eval(args.join(" "))}`);
        } catch (err) {
            message.channel.send(`${err}`);
        }
    } else if (command === "embed") {
        if (message.guild)
            message.delete();

        message.channel.send({ embeds: [Campaigns[0]] });
        message.channel.send({ embeds: [Campaigns[1]] });
    }
});