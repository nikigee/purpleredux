import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, Colors } from 'discord.js';

const THUMBNAILS = {
    p: 'https://cdn.shopify.com/s/files/1/1809/3169/products/untitled_7_of_43_1200x1200.jpg?v=1585167792',
    smg: 'https://cdnb.artstation.com/p/assets/images/images/028/299/387/large/charlie-rigden-3-min.jpg?1594071261',
    sht: 'https://cdnb.artstation.com/p/assets/images/images/011/573/169/large/malte-resenberger-loosmann-crusher-05.jpg?1530268695',
    rif: 'https://i.ytimg.com/vi/m1xCn8PJToc/maxresdefault.jpg',
    hvy: 'https://www.windowscentral.com/sites/wpcentral.com/files/styles/large/public/field/image/2020/12/cp2077-weapon-defender.jpg',
    melee: 'https://i.pinimg.com/originals/8d/50/e5/8d50e58794ab16be8db1512aefbf6a19.jpg',
    ex: 'https://i.pinimg.com/originals/cd/38/5f/cd385f4126c87eacb7be3fc0f02d5704.jpg',
    default: 'https://assets.codepen.io/1811205/internal/screenshots/pens/ZRyqNx.default.png?fit=cover&format=auto&ha=true&height=540&quality=75&v=2&version=1528915597&width=960'
};

const GUN_TYPES = {
    p: '🔫 Pistol',
    smg: '🔫 Submachine Gun',
    sht: '🔫 Shotgun',
    rif: '🔫 Rifle',
    hvy: '🔫 Heavy Weapon',
    melee: '🔪 Melee Weapon',
    ex: '⚔️ Exotic Weapon',
    default: '❓ Unknown'
};

const CONCEALABILITY = {
    p: '🛡️ Pocket',
    j: '🛡️ Jacket',
    l: '🛡️ Longcoat',
    default: "🛡️ Can't be hidden N/A"
};

const AVAILABILITY = {
    e: { description: '🟢 Excellent. Can be found almost anywhere.', color: Colors.Green },
    c: { description: '🟡 Common. Can be found in most sports & gun stores or on the street.', color: Colors.Yellow },
    p: { description: '🔴 Poor. Specialty weapons, black market, stolen military.', color: Colors.Red },
    r: { description: '⚫ Rare. Stolen, one of a kind, special military issue, may be highly illegal.', color: Colors.NotQuiteBlack },
    default: { description: '❓??', color: Colors.NotQuiteBlack }
};

const RELIABILITY = {
    vr: '💎 Very Reliable',
    st: '⚙️ Standard',
    ur: '🔧 Unreliable',
    default: '❓??'
};

export const data = new SlashCommandBuilder()
    .setName('gun')
    .setDescription('Translates a Cyberpunk gun\'s Weapon Code into something more readable.')
    .addStringOption(option => option.setName('code')
        .setDescription('The weapon code to translate')
        .setRequired(true));
export async function execute(interaction) {
    const code = interaction.options.getString('code');
    const contentArgs = code ? code.split(' ') : [];

    if (contentArgs.length < 9) {
        return interaction.reply({ content: 'Format is invalid! Ensure the weapon code is properly formatted.', ephemeral: true });
    }

    const gunType = contentArgs[0].toLowerCase();
    const gun = GUN_TYPES[gunType] || GUN_TYPES.default;
    const thumbnail = THUMBNAILS[gunType] || THUMBNAILS.default;

    const conceal = CONCEALABILITY[contentArgs[2].toLowerCase()] || CONCEALABILITY.default;

    const availabilityData = AVAILABILITY[contentArgs[3].toLowerCase()] || AVAILABILITY.default;
    const { description: availability, color } = availabilityData;

    const reliability = RELIABILITY[contentArgs[7].toLowerCase()] || RELIABILITY.default;

    const embed = new EmbedBuilder()
        .setDescription("This AI service will break down the gun code provided and translate it into human terms.")
        .setTitle(`Weapon Code: ${code}`)
        .setAuthor({ name: 'CYBERPUNK: Stagnation', iconURL: 'https://cdn.discordapp.com/attachments/549789418135879681/1047854457980981308/CyberpunkLogo3.png' })
        .setFooter({ text: 'Militech™ - © All Rights Reserved 2083' })
        .setThumbnail(thumbnail)
        .setColor(color)
        .addFields(
            { name: 'Type', value: `${contentArgs[0].toUpperCase()} = ${gun}`, inline: true },
            { name: 'Weapon Accuracy', value: `WA = ${contentArgs[1].toUpperCase()}`, inline: true },
            { name: 'Concealability', value: `${contentArgs[2].toUpperCase()} = ${conceal}`, inline: true },
            { name: 'Availability', value: `${contentArgs[3].toUpperCase()} = ${availability}`, inline: false },
            { name: 'Damage/Ammo', value: `${contentArgs[4]}`, inline: true },
            { name: 'Number of Shots', value: `${contentArgs[5]}`, inline: true },
            { name: 'Rate of Fire', value: `${contentArgs[6]}`, inline: true },
            { name: 'Reliability', value: `${contentArgs[7].toUpperCase()} = ${reliability}`, inline: true },
            { name: 'Range', value: contentArgs[8], inline: true }
        );

    await interaction.reply({ embeds: [embed] });

    await interaction.followUp(`Or to put that in more simple terms:
- This weapon will modify your to-hit bonus by **${contentArgs[1].toUpperCase()}**.
- You can target an enemy in a range of **${contentArgs[8]}**.
- You can fire this weapon **${contentArgs[6]}** times max per round of combat.
- You can fire this weapon **${contentArgs[5]}** times before you need to reload.
- It will deal **${contentArgs[4]}** damage. This damage *is not modified* by your Dexterity or Strength like with normal D&D weapons.`);
}
