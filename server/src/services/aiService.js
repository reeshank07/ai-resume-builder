
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function analyzeResume(resumeText, jobDescription) {
  const prompt = `
Compare this resume with the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return valid JSON with these fields:
{
  "matchScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "suggestions": []
}

Rules:
- matchScore must be between 0 and 100.
- Do not invent skills or qualifications.
- Give practical improvement suggestions.
- Return JSON only.
`;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  return JSON.parse(response.text);
}

module.exports = { analyzeResume };
