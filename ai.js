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
        if (v.contentType.includes("image")) {
            openAIContent.push({ type: "input_image", image_url: v.url }); // add each image to the prompt
        }
    });
    return openAIContent;
}

export async function execute(content, msg) {
    try {
        // Return stock answer if a non-dev tries accessing this. (save on API tokens)
        if (process.env.DEV_ID !== msg.author.id) {
            // return "beep : )";
        }

        const personality = `
            You are a discord AI with the personality and texting style of Judy Álvarez. 
            Sarcastic and goth.
            `.trim();

        let messages = [
            { role: "system", content: `${personality}. When asked, your name is Purple. Use lower case except for names. Keep responses short and concise.` }
        ];

        // Check if the message is a reply and include the replied-to message content or embed text
        if (msg.reference && msg.reference.messageId) {
            try {
                const repliedMessage = await msg.channel.messages.fetch(msg.reference.messageId);

                // include plain content if present
                if (repliedMessage.content) {
                    messages.push({
                        role: "user",
                        content: `Previous message: ${repliedMessage.author.username}: ${repliedMessage.content}`
                    });
                }

                // include embeds if present
                if (repliedMessage.embeds && repliedMessage.embeds.length > 0) {
                    repliedMessage.embeds.forEach((embed, i) => {
                        const embedText = parseEmbed(embed);

                        if (embedText) {
                            messages.push({
                                role: "user",
                                content: `Previous embed${repliedMessage.embeds.length > 1 ? ` #${i + 1}` : ''} from ${repliedMessage.author.username}:\n${embedText}`
                            });
                        }
                    });
                }

                if (repliedMessage.attachments.size > 0) {
                    const openAIContent = parseImage(repliedMessage.attachments, repliedMessage.content); // turn discord attachments into a format chatgpt understands

                    messages.push({ role: "user", content: openAIContent });
                }

            } catch (err) {
                console.log("[AI] failed to fetch replied message:", err);
            }
        }

        // Check if the message contains an image, and if so, get the AI to analyse it
        // (may be a little cost intense so be sure to monitor usage and disable if too costly)
        if (msg.attachments.size > 0) {
            const openAIContent = parseImage(msg.attachments, content); // turn discord attachments into a format chatgpt understands

            messages.push({ role: "user", content: openAIContent });
        } else {
            // Include the current user's message
            messages.push({ role: "user", content });
        }

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
