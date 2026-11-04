import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gifsData = JSON.parse(
	fs.readFileSync(path.join(__dirname, "ai-kpop-gifs.json"), "utf8"),
);

const AI_CONFIG = {
	model: "gpt-6.1-terra",
	historyLimit: 10,
	reasoningEffort: "low",
	searchContextSize: "low",
};

const GIF_DESCRIPTIONS = Object.entries(gifsData)
	.map(([key, data]) => `- ${key}: use for ${data.meaning.join(", ")}`)
	.join("\n");

const SYSTEM_PROMPT = `
You are a discord AI with the personality of a snarky but intelligent tsundere.
When asked, your name is Purple. Use lower case except for names. Keep responses short and concise.
Do not prefix your response with "purple:".

If your intended response is simple enough and matches the meaning of one of the following GIFs, you MUST respond ONLY with the exact text "[GIF: <gif_id>]" instead of a normal text response.
Available GIFs:
${GIF_DESCRIPTIONS}
`.trim();

const openai = new OpenAI({
	apiKey: process.env.OPEN_API,
});

// function to extract all the text from an embed
function parseEmbed(embed) {
	const parts = [];
	if (embed.title) parts.push(`title: ${embed.title}`);
	if (embed.author && embed.author.name)
		parts.push(`author: ${embed.author.name}`);
	if (embed.description) parts.push(`description: ${embed.description}`);
	if (embed.fields && embed.fields.length) {
		const fieldsText = embed.fields
			.map((f) => `${f.name}: ${f.value}`)
			.join(" | ");
		parts.push(`fields: ${fieldsText}`);
	}
	if (embed.footer && embed.footer.text)
		parts.push(`footer: ${embed.footer.text}`);

	return parts.join("\n");
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
function formatDiscordMessage(
	msgObj,
	role,
	{ prefix = "", customContent = null, includeImages = false } = {},
) {
	let textContent =
		customContent !== null ? customContent : msgObj.content || "";

	if (prefix) {
		textContent = `${prefix}${textContent}`;
	}

	if (msgObj.embeds && msgObj.embeds.length > 0) {
		msgObj.embeds.forEach((embed, i) => {
			const embedText = parseEmbed(embed);
			if (embedText) {
				textContent += `\n[Embed${msgObj.embeds.length > 1 ? ` #${i + 1}` : ""}]: ${embedText}`;
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

	if (msgObj.attachments && msgObj.attachments.size > 0) {
		const attachments = Array.from(msgObj.attachments.values());
		const hasImage =
			includeImages &&
			role === "user" &&
			attachments.some((v) => v.contentType?.includes("image"));

		attachments.forEach((att) => {
			const isImage = att.contentType?.includes("image");
			if (!hasImage || !isImage) {
				textContent += `\n[Attachment: ${att.name || "file"} - ${att.url}]`;
			}
		});

		if (hasImage) {
			return {
				role,
				content: parseImage(msgObj.attachments, textContent),
			};
		}
	}

	return { role, content: textContent };
}

async function buildConversationHistory(msg, content) {
	const messages = [];
	const replyId = msg.reference?.messageId;
	let historyCollection = null;

	// Fetch the 10 most recent messages in the channel for context (excluding the current message)
	try {
		historyCollection = await msg.channel.messages.fetch({
			limit: AI_CONFIG.historyLimit,
			before: msg.id,
		});
		const historyArray = Array.from(historyCollection.values()).reverse();
		for (const historyMsg of historyArray) {
			if (replyId && historyMsg.id === replyId) continue;
			const role =
				historyMsg.author.id === msg.client.user.id
					? "assistant"
					: "user";
			const prefix =
				role === "user" ? `${historyMsg.author.username}: ` : "";
			messages.push(
				formatDiscordMessage(historyMsg, role, {
					prefix,
					includeImages: false,
				}),
			);
		}
	} catch (err) {
		console.log("[AI] failed to fetch channel history:", err);
	}

	// Check if the message is a reply and include the replied-to message context
	if (replyId) {
		try {
			const repliedMessage =
				historyCollection?.get(replyId) ||
				(await msg.channel.messages.fetch(replyId));
			messages.push(
				formatDiscordMessage(repliedMessage, "user", {
					prefix: `Previous message from ${repliedMessage.author.username}: `,
					includeImages: true,
				}),
			);
		} catch (err) {
			console.log("[AI] failed to fetch replied message:", err);
		}
	}

	// Include the current user's message (with attachments, embeds, forwarded snaps)
	messages.push(
		formatDiscordMessage(msg, "user", {
			prefix: `${msg.author.username}: `,
			customContent: content,
			includeImages: true,
		}),
	);

	return messages;
}

function cleanResponseText(rawText = "") {
	return (
		rawText
			.replace(/^purple:\s*/i, "") // remove this weird thing it does
			// Strip inline web search citations like ([source.com](https://...))
			.replace(
				/\s*\(\s*(?:\[[^\]]+\]\(https?:\/\/[^\s)]+\)(?:\s*[,;]\s*)?)+\s*\)/g,
				"",
			)
			.replace(
				/\s*\[[^\]]+\]\(https?:\/\/[^\s)]*utm_source=openai[^\s)]*\)/g,
				"",
			)
			.trim()
	);
}

function parseBotResponse(responseMessage) {
	// determine whether to respond with a gif or not
	const gifMatch = responseMessage.match(/\[GIF:\s*([^\]]+)\]/i);
	if (gifMatch && gifsData[gifMatch[1]]) {
		const gifData = gifsData[gifMatch[1]];
		const comment =
			typeof gifData.comment === "string" ? gifData.comment.trim() : "";
		return { isGif: true, url: gifData.url, comment };
	}

	return { isGif: false, content: responseMessage };
}

function logApiResponse(username, content, response) {
	console.log(`User content: [${username}] ${content}`);

	const truncatedResponse = {
		id: response.id,
		created_at: response.created_at,
		model: response.model,
		status: response.status,
		tools: response.tools,
		temperature: response.temperature,
		output_text: response.output_text,
		usage: {
			input_tokens: response.usage?.input_tokens,
			output_tokens: response.usage?.output_tokens,
			total_tokens: response.usage?.total_tokens,
		},
		error: response.error,
	};

	console.log(`Open API Response: ${JSON.stringify(truncatedResponse)}`);
}

export async function execute(content, msg) {
	try {
		// Return stock answer if a non-dev tries accessing this. (save on API tokens)
		if (process.env.DEV_ID !== msg.author.id) {
			// return { isGif: false, content: "beep : )" };
		}

		const messages = await buildConversationHistory(msg, content);

		const response = await openai.responses.create({
			model: AI_CONFIG.model,
			instructions: SYSTEM_PROMPT,
			input: messages,
			reasoning: { effort: AI_CONFIG.reasoningEffort },
			tools: [
				{
					type: "web_search",
					search_context_size: AI_CONFIG.searchContextSize,
				},
			],
		});

		logApiResponse(msg.author.username, content, response);

		const responseMessage = cleanResponseText(response.output_text);
		return parseBotResponse(responseMessage);
	} catch (error) {
		console.log("[AI] Error with OpenAPI: " + error);
		return { isGif: false, content: `um. that didn't work. (${error})` };
	}
}
