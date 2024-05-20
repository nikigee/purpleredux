const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows some useful stats such as the number of servers running and the current uptime.'),
    async execute(interaction) {
        const client = interaction.client;

        // Calculate memory usage
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
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
            .setColor(0x6a0dad)
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
    },
};
