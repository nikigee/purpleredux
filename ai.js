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

            const response = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a mean but helpful AI with the personality of an anime girl who types in all lower-case. Your name is Purple." },
                    { role: "user", content }
                ],
                model: "gpt-4o-mini"
            });

            console.log(`User content: [${msg.author.username}] ${content}`);
            console.log(`Open API Response: ${JSON.stringify(response)}`);
            return response.choices[0].message.content;
        } catch (error) {
            console.log("[AI] Error with OpenAPI: " + error);
            return `Um. That didn't work. (${error})`;
        }
    }
}