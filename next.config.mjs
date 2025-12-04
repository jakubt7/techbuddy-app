/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/generate-output": [
        "./node_modules/@gptscript-ai/gptscript/bin/**",
        "./node_modules/@gptscript-ai/gptscript/dist/**",
        "./node_modules/@gptscript-ai/gptscript/package.json",
        "./app/api/generate-output/tech-solution.gpt",
      ],
      "/api/generate-output/route": [
        "./node_modules/@gptscript-ai/gptscript/bin/**",
        "./node_modules/@gptscript-ai/gptscript/dist/**",
        "./node_modules/@gptscript-ai/gptscript/package.json",
        "./app/api/generate-output/tech-solution.gpt",
      ],
    },
  },
};

export default nextConfig;
