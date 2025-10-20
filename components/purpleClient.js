import 'dotenv/config';

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`../commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.login(process.env.DISCORD_TOKEN);

export { client };