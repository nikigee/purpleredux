require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, EmbedBuilder } = require('discord.js');
const { readdirSync } = require('fs');
const ai = require('./ai');  // Import the AI module

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Purple is online!');

    client.user.setPresence({
        activities: [{ name: `with your heart`, type: ActivityType.Playing }],
        status: 'online',
    });
});

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
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Check if the bot is mentioned in the message
    if (message.mentions.has(client.user)) {
        const request = message.content.replace(`<@${client.user.id}>`, '').trim();
        if (request.length > 0) {
            // Call the AI function from ai.js
            const aiResponse = await ai.execute(request, message);

            message.reply(aiResponse);
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

        const exampleEmbed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('The Death House')
            .setDescription('There is a monster in our house. He is ancient. He is the land.')
            .setThumbnail('https://spg-images.s3.us-west-1.amazonaws.com/1855211d-a6dd-45ef-8aef-656c325f8b5b')
            .addFields(
                { name: "GM", value: "Liam", inline: false },
                { name: "Party Members", value: "Zeph, Herman Jägervordt, New Character (Fletcher)", inline: false },
                { name: "Theme", value: "https://www.youtube.com/watch?v=eBHtQ07gvC0" }
            )
            .setTimestamp()
            .setFooter({ text: '2023', iconURL: 'https://th.bing.com/th/id/OIP.8pCoix1aHHo_hvBGG0Dy-wAAAA?rs=1&pid=ImgDetMain' });

        message.channel.send({ embeds: [exampleEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
