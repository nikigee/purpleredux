const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gun')
        .setDescription('Translates a Cyberpunk gun\'s Weapon Code into something more readable.')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The weapon code to translate')
                .setRequired(true)),
    async execute(interaction) {
        const contentArgs = interaction.options.getString('code').split(' ');
        const contentClean = interaction.options.getString('code');

        const embed = new EmbedBuilder()
            .setDescription("This is a weapon code translation service provided at no cost by Militech™ - Keeping the population informed and safe.")
            .setTitle(contentClean)
            .setAuthor({ name: 'CYBERPUNK: Stagnation', iconURL: 'https://cdn.discordapp.com/attachments/549789418135879681/1047854457980981308/CyberpunkLogo3.png' })
            .setFooter({ text: 'Militech™ - © All Rights Reserved 2083' });

        if (contentArgs.length < 7) {
            throw new Error('Format is invalid!');
        }

        // make everything lowercase for convenience
        contentArgs.forEach((x, i) => {
            contentArgs[i] = x.toLowerCase();
        });

        // Gun Type
        let gun;
        switch (contentArgs[1]) {
            case 'p':
                gun = 'Pistol';
                embed.setThumbnail('https://cdn.shopify.com/s/files/1/1809/3169/products/untitled_7_of_43_1200x1200.jpg?v=1585167792');
                break;
            case 'smg':
                gun = 'Submachine Gun';
                embed.setThumbnail('https://cdnb.artstation.com/p/assets/images/images/028/299/387/large/charlie-rigden-3-min.jpg?1594071261');
                break;
            case 'sht':
                gun = 'Shotgun';
                embed.setThumbnail('https://cdnb.artstation.com/p/assets/images/images/011/573/169/large/malte-resenberger-loosmann-crusher-05.jpg?1530268695');
                break;
            case 'rif':
                gun = 'Rifle';
                embed.setThumbnail('https://i.ytimg.com/vi/m1xCn8PJToc/maxresdefault.jpg');
                break;
            case 'hvy':
                gun = 'Heavy Weapon';
                embed.setThumbnail('https://www.windowscentral.com/sites/wpcentral.com/files/styles/large/public/field/image/2020/12/cp2077-weapon-defender.jpg');
                break;
            case 'melee':
                gun = 'Melee Weapon';
                embed.setThumbnail('https://i.pinimg.com/originals/8d/50/e5/8d50e58794ab16be8db1512aefbf6a19.jpg');
                break;
            case 'ex':
                gun = 'Exotic Weapon';
                embed.setThumbnail('https://i.pinimg.com/originals/cd/38/5f/cd385f4126c87eacb7be3fc0f02d5704.jpg');
                break;
            default:
                gun = 'Unknown';
                embed.setThumbnail('https://assets.codepen.io/1811205/internal/screenshots/pens/ZRyqNx.default.png?fit=cover&format=auto&ha=true&height=540&quality=75&v=2&version=1528915597&width=960');
        }

        // Concealability
        let conceal;
        switch (contentArgs[3]) {
            case 'p':
                conceal = 'Pocket';
                break;
            case 'j':
                conceal = 'Jacket';
                break;
            case 'l':
                conceal = 'Longcoat';
                break;
            default:
                conceal = "Can't be hidden N/A";
        }

        // Availability
        let availability;
        switch (contentArgs[4]) {
            case 'e':
                availability = 'Excellent. Can be found almost anywhere.';
                embed.setColor(Colors.Green);
                break;
            case 'c':
                availability = 'Common. Can be found in most sports & gun stores or on the street.';
                embed.setColor(Colors.Yellow);
                break;
            case 'p':
                availability = 'Poor. Specialty weapons, black market, stolen military.';
                embed.setColor(Colors.Red);
                break;
            case 'r':
                availability = 'Rare. Stolen, one of a kind, special military issue, may be highly illegal.';
                embed.setColor(Colors.NotQuiteBlack);
                break;
            default:
                availability = '??';
        }

        // Reliability
        let reliability;
        switch (contentArgs[8]) {
            case 'vr':
                reliability = 'Very Reliable';
                break;
            case 'st':
                reliability = 'Standard';
                break;
            case 'ur':
                reliability = 'Unreliable';
                break;
            default:
                reliability = '??';
        }

        embed.addFields(
            { name: 'Type', value: `${contentArgs[1].toUpperCase()} = ${gun}`, inline: true },
            { name: 'Weapon Accuracy', value: `WA = ${contentArgs[2].toUpperCase()}`, inline: true },
            { name: 'Concealability', value: `${contentArgs[3].toUpperCase()} = ${conceal}`, inline: true },
            { name: 'Availability', value: `${contentArgs[4].toUpperCase()} = ${availability}`, inline: false },
            { name: 'Damage/Ammo', value: `${contentArgs[5]}`, inline: true },
            { name: 'Number of Shots', value: `${contentArgs[6]}`, inline: true },
            { name: 'Rate of Fire', value: `${contentArgs[7]}`, inline: true },
            { name: 'Reliability', value: `${contentArgs[8].toUpperCase()} = ${reliability}`, inline: true },
            { name: 'Range', value: contentArgs[9], inline: true }
        );

        await interaction.reply({ embeds: [embed] });

        await interaction.followUp(`Or to put that in more simple terms:
- This weapon will modify your to-hit bonus by **${contentArgs[2].toUpperCase()}**.
- You can target an enemy in a range of **${contentArgs[9]}**.
- You can fire this weapon **${contentArgs[7]}** times max per round of combat.
- You can fire this weapon **${contentArgs[6]}** times before you need to reload.
- It will deal **${contentArgs[5]}** damage. This damage *is not modified* by your Dexterity or Strength like with normal D&D weapons.`);
    },
};
