import { GPTScript } from "@gptscript-ai/gptscript";

const gpt = new GPTScript({
    APIKey: process.env.OPENAI_API_KEY,
    DefaultModel: "gpt-3.5-turbo"
});

export default gpt