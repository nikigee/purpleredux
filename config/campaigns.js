import 'dotenv/config';
import { EmbedBuilder, Colors } from 'discord.js';

const Eldervine = new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle('Secrets of Eldervine Bay')
    .setDescription(`In northern Aquitaine, the coastal town of Eldervine Bay is under siege by ruthless bandits, disrupting trade and bringing the community to its knees. Can anyone stop these brigands before they uncover a certain lost artefact of a bygone era?`)
    .setThumbnail('https://i.imgur.com/vYmRuXL.jpeg')
    .addFields(
        { name: "GM", value: "Nikita", inline: false },
        { name: "Party Members", value: "Zari Tarifian, Louis, Kithkar, Emelio Carlos Fernandos", inline: false },
        { name: "Theme", value: "https://www.youtube.com/watch?v=pcfx_8NoXR4", inline: false }
    )
    .setTimestamp()
    .setFooter({ text: '2024', iconURL: 'https://i.imgur.com/3Refr49.png' });

const Styes = new EmbedBuilder()
    .setColor('#ebe685')
    .setTitle('The Styes Conspiracy')
    .setDescription(`“Ve are certain you vill enjoy your stay in zis lavish, luxury city for all to enjoy and indulge… *Velcome to Ze Styyyyyyeeeesssssss….*”`)
    .setThumbnail('https://cdn.discordapp.com/attachments/425229440675479553/1388013228327436369/IMG_1079.webp?ex=685f6f8d&is=685e1e0d&hm=861b17f82409e9db1deb3bc3151d18df221d4e27fa6797b680f23727e3575073&')
    .addFields(
        { name: "GM", value: "Dimmi", inline: false },
        { name: "Party Members", value: `El’Vivel, Arctos Th’Urrin, Elyria, Khernes Stonelung, Samuel Beckett`, inline: false },
        { name: "Theme", value: "https://m.youtube.com/watch?v=A441Km_MwH8", inline: true },
        { name: "Soundtrack", value: "https://drive.google.com/drive/folders/1_qobGe8-Pwxz0LKLWSv_uM784-mywzNQ", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: '2025', iconURL: 'https://cdn.discordapp.com/attachments/425229440675479553/1388016769028853850/image.jpg?ex=685f72d9&is=685e2159&hm=cd0b048a83bc011004203516246cbb1acff786d69a591c9c35c96006d4380c3c&' });


export const Campaigns = [Eldervine, Styes];