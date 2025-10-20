import 'dotenv/config';
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPEN_API
});

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
                        const parts = [];
                        if (embed.title) parts.push(`title: ${embed.title}`);
                        if (embed.author && embed.author.name) parts.push(`author: ${embed.author.name}`);
                        if (embed.description) parts.push(`description: ${embed.description}`);
                        if (embed.fields && embed.fields.length) {
                            const fieldsText = embed.fields.map(f => `${f.name}: ${f.value}`).join(' | ');
                            parts.push(`fields: ${fieldsText}`);
                        }
                        if (embed.footer && embed.footer.text) parts.push(`footer: ${embed.footer.text}`);

                        const embedText = parts.join('\n');
                        if (embedText) {
                            messages.push({
                                role: "user",
                                content: `Previous embed${repliedMessage.embeds.length > 1 ? ` #${i + 1}` : ''} from ${repliedMessage.author.username}:\n${embedText}`
                            });
                        }
                    });
                }
            } catch (err) {
                console.log("[AI] failed to fetch replied message:", err);
            }
        }

        // Include the current user's message
        messages.push({ role: "user", content });

        const response = await openai.chat.completions.create({
            messages,
            model: "gpt-5"
        });

        console.log(`User content: [${msg.author.username}] ${content}`);
        console.log(`Open API Response: ${JSON.stringify(response)}`);

        let responseMessage = response.choices[0].message.content;
        if (responseMessage.toLowerCase().startsWith("purple: "))
            responseMessage = responseMessage.slice(8, responseMessage.length); // remove this weird thing it does

        return responseMessage;
    } catch (error) {
        console.log("[AI] Error with OpenAPI: " + error);
        return `um. that didn't work. (${error})`;
    }
}
