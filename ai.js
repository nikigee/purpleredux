import 'dotenv/config';
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPEN_API
});

// function to extract all the text from an embed
function parseEmbed(embed) {
    const parts = [];
    if (embed.title) parts.push(`title: ${embed.title}`);
    if (embed.author && embed.author.name) parts.push(`author: ${embed.author.name}`);
    if (embed.description) parts.push(`description: ${embed.description}`);
    if (embed.fields && embed.fields.length) {
        const fieldsText = embed.fields.map(f => `${f.name}: ${f.value}`).join(' | ');
        parts.push(`fields: ${fieldsText}`);
    }
    if (embed.footer && embed.footer.text) parts.push(`footer: ${embed.footer.text}`);

    return parts.join('\n');
}

function parseImage(attachments, description) {
    const openAIContent = [{ type: "input_text", text: description }];
    attachments.forEach((v) => {
        if (v.contentType && v.contentType.includes("image")) {
            openAIContent.push({ type: "input_image", image_url: v.url }); // add each image to the prompt
        }
    });
    return openAIContent;
}

// Universal helper to format any Discord message for OpenAI context
function formatDiscordMessage(msgObj, role, prefix = "", customContent = null) {
    let textContent = customContent !== null ? customContent : (msgObj.content || "");

    if (prefix) {
        textContent = `${prefix}${textContent}`;
    }

    if (msgObj.embeds && msgObj.embeds.length > 0) {
        msgObj.embeds.forEach((embed, i) => {
            const embedText = parseEmbed(embed);
            if (embedText) {
                textContent += `\n[Embed${msgObj.embeds.length > 1 ? ` #${i + 1}` : ''}]: ${embedText}`;
            }
        });
    }

    if (msgObj.messageSnapshots && msgObj.messageSnapshots.size > 0) {
        msgObj.messageSnapshots.forEach((snapshot) => {
            const forwardAuthor = snapshot.author?.username || "Unknown";
            const forwardContent = snapshot.content || "";
            textContent += `\n[Forwarded message from ${forwardAuthor}]: ${forwardContent}`;

            if (snapshot.embeds && snapshot.embeds.length > 0) {
                snapshot.embeds.forEach((embed) => {
                    const embedText = parseEmbed(embed);
                    if (embedText) {
                        textContent += `\n[Forwarded embed]: ${embedText}`;
                    }
                });
            }
        });
    }

    if (role === "user" && msgObj.attachments && msgObj.attachments.size > 0) {
        const hasImage = Array.from(msgObj.attachments.values()).some(v => v.contentType && v.contentType.includes("image"));
        if (hasImage) {
            const openAIContent = parseImage(msgObj.attachments, textContent);
            return { role, content: openAIContent };
        }
    }

    if (msgObj.attachments && msgObj.attachments.size > 0) {
        msgObj.attachments.forEach((att) => {
            textContent += `\n[Attachment: ${att.name || 'file'} - ${att.url}]`;
        });
    }

    return { role, content: textContent };
}

export async function execute(content, msg) {
    try {
        // Return stock answer if a non-dev tries accessing this. (save on API tokens)
        if (process.env.DEV_ID !== msg.author.id) {
            // return "beep : )";
        }

        const personality = `
            You are a discord AI with the personality of a snarky but intelligent tsundere
            `.trim();

        let messages = [
            { role: "system", content: `${personality}. When asked, your name is Purple. Use lower case except for names. Keep responses short and concise.` }
        ];

        // Fetch the 10 most recent messages in the channel for context (excluding the current message)
        try {
            const history = await msg.channel.messages.fetch({ limit: 10, before: msg.id });
            const historyArray = Array.from(history.values()).reverse();
            for (const historyMsg of historyArray) {
                const role = historyMsg.author.id === msg.client.user.id ? "assistant" : "user";
                const prefix = role === "user" ? `${historyMsg.author.username}: ` : "";
                messages.push(formatDiscordMessage(historyMsg, role, prefix));
            }
        } catch (err) {
            console.log("[AI] failed to fetch channel history:", err);
        }

        // Check if the message is a reply and include the replied-to message context
        if (msg.reference && msg.reference.messageId) {
            try {
                const repliedMessage = await msg.channel.messages.fetch(msg.reference.messageId);
                messages.push(formatDiscordMessage(repliedMessage, "user", `Previous message from ${repliedMessage.author.username}: `));
            } catch (err) {
                console.log("[AI] failed to fetch replied message:", err);
            }
        }

        // Include the current user's message (with attachments, embeds, forwarded snaps)
        messages.push(formatDiscordMessage(msg, "user", "", content));

        const response = await openai.responses.create({
            input: messages,
            model: "gpt-5"
        });

        console.log(`User content: [${msg.author.username}] ${content}`);

        const truncated_response = {
            "id": response.id,
            "created_at": response.created_at,
            "model": response.model,
            "status": response.status,
            "tools": response.tools,
            "temperature": response.temperature,
            "output_text": response.output_text,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "error": response.error
        };

        console.log(`Open API Response: ${JSON.stringify(truncated_response)}`);

        let responseMessage = response.output_text;
        if (responseMessage.toLowerCase().startsWith("purple: "))
            responseMessage = responseMessage.slice(8, responseMessage.length); // remove this weird thing it does

        return responseMessage;
    } catch (error) {
        console.log("[AI] Error with OpenAPI: " + error);
        return `um. that didn't work. (${error})`;
    }
}
