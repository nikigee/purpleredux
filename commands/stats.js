import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { totalmem } from 'os';

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows some useful stats such as the number of servers running and the current uptime.');
export async function execute(interaction) {
    const client = interaction.client;

    // Calculate memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = totalmem();
    const usedMemory = memoryUsage.heapUsed / totalMemory * 100;

    // Get the bot's uptime in a more readable format
    const uptimeSeconds = Math.floor(client.uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const hours = uptimeHours % 24;
    const minutes = uptimeMinutes % 60;
    const seconds = uptimeSeconds % 60;

    // Get the bot's latency
    const latency = Date.now() - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
        .setColor(6950317)
        .setTitle("Purple Stats")
        .setDescription('my stats ʚ(*´꒳`*)ɞ')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: 'Uptime', value: `${uptimeDays}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
            { name: 'Voice Connections', value: String(client.voice.adapters.size), inline: true },
            { name: 'Servers Running', value: String(client.guilds.cache.size), inline: true },
            { name: 'Total Users', value: String(client.users.cache.size), inline: true },
            { name: 'Memory Usage', value: `${usedMemory.toFixed(2)}%`, inline: true },
            { name: 'Latency', value: `${latency}ms`, inline: true }
        )
        .setTimestamp();

    console.log(`User '${interaction.user.username}' has requested stats.`);

    await interaction.reply({ embeds: [embed] });
}
