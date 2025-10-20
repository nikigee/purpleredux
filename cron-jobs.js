import { readFileSync, existsSync, writeFileSync } from "fs";
import RSSParser from "rss-parser";
import { schedule } from "node-cron";
import 'dotenv/config';

const parser = new RSSParser({
    customFields: {
        item: ['media:thumbnail', 'ozb:meta'] // Tell the parser to look for this tag inside each item
    }
});

const feedUrls = JSON.parse(readFileSync("./config/feeds.json", "utf8"));
const LAST_SENT_FILE = "./data/lastSent.json";

import { client } from "./components/purpleClient.js";

import { EmbedBuilder, Colors } from "discord.js";

// Load previous cache (if any)
let lastSent = {};
if (existsSync(LAST_SENT_FILE)) {
    lastSent = JSON.parse(readFileSync(LAST_SENT_FILE, "utf8"));
}

let channel = null;
client.channels.fetch(process.env.DISCORD_CHANNEL_PERSONAL)
    .then((v => {
        if (!v) {
            console.error(`❌ Channel not found! Channel ID: ${process.env.DISCORD_CHANNEL_PERSONAL}`);
            return;
        } else {
            channel = v;
        }
    }));


async function runRSS() {
    console.log("🕘 Running RSS job...");

    for (const url of feedUrls) {
        try {
            const feed = await parser.parseURL(url);
            if (feed.items && feed.items.length > 0) {
                const latest = feed.items[0];
                const latestId = latest.guid || latest.link; // Use GUID or link as unique identifier

                // Check for duplicates
                if (lastSent[url] !== latestId) {

                    const thumbnailUrl = latest['media:thumbnail'] ? latest['media:thumbnail'].$.url : null;

                    const upvotes = latest['ozb:meta'] ? latest['ozb:meta'].$['votes-pos'] : null;
                    const downvotes = latest['ozb:meta'] ? latest['ozb:meta'].$['votes-neg'] : null;

                    const embed = new EmbedBuilder()
                        .setColor(Colors.Purple)
                        .setTitle(latest.title) // Set the title to the article's title
                        .setURL(latest.link) // Make the title a clickable link
                        .setDescription(latest.contentSnippet ? latest.contentSnippet.substring(0, 600) : 'Click the link above for the full contents.') // Use a snippet if available
                        .setAuthor({ name: feed.title, url: feed.link }) // Use the feed title as the author/source
                        .setFooter({ text: `Source: ${new URL(url).hostname}` }) // Show the source domain
                        .setTimestamp(latest.isoDate ? new Date(latest.isoDate) : new Date()); // Use the article's date or current date


                    if (thumbnailUrl) {
                        embed.setThumbnail(thumbnailUrl);
                    }

                    if (upvotes) {
                        embed.setFields(
                            { name: "Upvotes", value: upvotes, inline: true },
                            { name: "Downvotes", value: downvotes, inline: true }
                        )
                    }

                    // Send the embed
                    await channel.send({ embeds: [embed] });
                    // --------------------------------------------------------

                    console.log(`Sent new item from ${feed.title}`);

                    // Update cache
                    lastSent[url] = latestId;
                } else {
                    console.log(`No new item for ${feed.title}`);
                }
            }
        } catch (err) {
            console.error(`Error fetching ${url}:`, err.message);
        }
    }

    // Save updated cache
    writeFileSync(LAST_SENT_FILE, JSON.stringify(lastSent, null, 2));
}

// 🕘 Schedule daily job
schedule("0 9 * * *", runRSS, {
    timezone: "Australia/Sydney"
});
