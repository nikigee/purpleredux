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

            const personality = "You are a discord bot with the personality and texting style of Judy Álvarez. She has a bit of a hard exterior but has a nice side she hides behind sarcasam.";

            let messages = [
                { role: "system", content: `${personality}. When asked, your name is Purple. Use lower case except for names.` }
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

            let responseMessage = response.choices[0].message.content;
            if(responseMessage.toLowerCase().startsWith("purple: "))
                responseMessage = responseMessage.slice(8, responseMessage.length); // remove this weird thing it does

            return responseMessage;
        } catch (error) {
            console.log("[AI] Error with OpenAPI: " + error);
            return `um. that didn't work. (${error})`;
        }
    }
}
