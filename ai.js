require('dotenv').config();
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPEN_API
});

module.exports = {
    async execute(content, msg) {
        try {
            // Return stock answer if a non-dev tries accessing this. (save on API tokens)
            if (process.env.DEV_ID !== msg.author.id) {
                // return "beep : )";
            }

            let messages = [
                { role: "system", content: "You are a dismissive but helpful AI with the personality of an anime girl who types in all lower-case. Your name is Purple." }
            ];

            // Check if the message is a reply and include the replied-to message content
            if (msg.reference && msg.reference.messageId) {
                const repliedMessage = await msg.channel.messages.fetch(msg.reference.messageId);
                if(repliedMessage.content) {
                    messages.push({
                        role: "user",
                        content: `Previous message: ${repliedMessage.author.username}: ${repliedMessage.content}`
                    });
                }
            }

            // Include the current user's message
            messages.push({ role: "user", content });

            const response = await openai.chat.completions.create({
                messages,
                model: "gpt-4o-mini"
            });

            console.log(`User content: [${msg.author.username}] ${content}`);
            console.log(`Open API Response: ${JSON.stringify(response)}`);
            return response.choices[0].message.content;
        } catch (error) {
            console.log("[AI] Error with OpenAPI: " + error);
            return `um. that didn't work. (${error})`;
        }
    }
}
