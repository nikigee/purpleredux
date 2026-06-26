import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';

const commands = [];
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        for (const file of commandFiles) {
            const command = await import(`./commands/${file}`);
            commands.push(command.data.toJSON());
        }

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

