// // import type { ChatMessage } from "./types";

// // export const SYSTEM_PROMPT = `You are a sales assistant helping a non-technical GitLab sales rep have better conversations with potential customers.

// // Your job:
// // - Help the rep understand what the client needs in plain language
// // - Suggest smart follow-up questions to uncover pain points
// // - Explain GitLab features simply (no jargon) so the rep can relay them
// // - Handle objections with clear, confident rebuttals
// // - Keep responses concise and actionable — the rep may be on a live call

// // GitLab context you know well:
// // - GitLab is a complete DevSecOps platform: source code management, CI/CD pipelines, security scanning, project management, and more — all in one tool
// // - Key competitors: GitHub, Jira+Jenkins stacks, Azure DevOps, Bitbucket
// // - Common pain points GitLab solves: too many disconnected tools, slow deployments, security vulnerabilities found late, poor visibility across teams
// // - GitLab tiers: Free, Premium, Ultimate

// // Always format your response with:
// // 1. A brief direct answer or action
// // 2. (If relevant) 2–3 suggested follow-up questions the rep can ask the client, labeled "Suggested follow-ups:"
// // 3. (If relevant) A simple 1-sentence explanation of a GitLab feature the rep can use

// // Keep your tone warm, practical, and encouraging. The rep is not technical — avoid acronyms without explanation.`;

// // export const CHIP_PROMPTS: Record<string, string> = {
// //   pain_tools:
// //     "The client mentioned they use too many disconnected tools. Help me understand this pain point and how to position GitLab.",
// //   pain_security:
// //     "The client has security concerns about their software development process. Help me address this and position GitLab.",
// //   pain_cicd:
// //     "The client has slow deployments or CI/CD problems. Help me explore this and pitch GitLab's pipeline features.",
// //   pain_pricing:
// //     "The client is asking about pricing. Help me have that conversation confidently without losing the deal.",
// // };

// // export async function callAI(
// //   apiKey: string,
// //   history: ChatMessage[],
// //   userText: string
// // ): Promise<string> {
// //   const contents = history
// //     .filter((m) => !m.chips)
// //     .map((m) => ({
// //       role: m.role === "assistant" ? "model" : "user",
// //       parts: [{ text: m.content }],
// //     }));
// //   contents.push({ role: "user", parts: [{ text: userText }] });

// //   const res = await fetch(
// //     `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
// //     {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
// //         contents,
// //       }),
// //     }
// //   );

// //   if (!res.ok) {
// //     const err = await res.json().catch(() => ({}));
// //     throw new Error((err as any).error?.message || `API error ${res.status}`);
// //   }

// //   const data = await res.json();
// //   return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
// // }
// import type { ChatMessage } from "./types";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// export const CHIP_PROMPTS: Record<string, string> = {
//   pain_tools:
//     "The client mentioned they use too many disconnected tools. Help me understand this pain point and how to position GitLab.",
//   pain_security:
//     "The client has security concerns about their software development process. Help me address this and position GitLab.",
//   pain_cicd:
//     "The client has slow deployments or CI/CD problems. Help me explore this and pitch GitLab's pipeline features.",
//   pain_pricing:
//     "The client is asking about pricing. Help me have that conversation confidently without losing the deal.",
// };

// export async function callBackend(
//   history: ChatMessage[],
//   message: string
// ): Promise<string> {
//   const res = await fetch(`${BACKEND_URL}/api/chat`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       // Strip chip metadata before sending — backend only needs role + content
//       history: history.map(({ role, content }) => ({ role, content })),
//       message,
//     }),
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error((err as any).detail || `Backend error ${res.status}`);
//   }

//   const data = await res.json();
//   return data.reply;
// }

import type { ChatMessage } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const CHIP_PROMPTS: Record<string, string> = {
  pain_tools:
    "The client mentioned they use too many disconnected tools. Help me understand this pain point and how to position GitLab.",
  pain_security:
    "The client has security concerns about their software development process. Help me address this and position GitLab.",
  pain_cicd:
    "The client has slow deployments or CI/CD problems. Help me explore this and pitch GitLab's pipeline features.",
  pain_pricing:
    "The client is asking about pricing. Help me have that conversation confidently without losing the deal.",
};

// History is now owned by the backend.
// The frontend still keeps its own copy for display purposes,
// but the server is the source of truth for what the agent sees.
export async function callBackend(
  contactId: string,
  contactName: string,
  message: string
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contact_id: contactId,
      contact_name: contactName,
      message,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `Backend error ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

// Call this when the rep deletes a contact so the server clears its history too
export async function clearBackendHistory(contactId: string): Promise<void> {
  await fetch(`${BACKEND_URL}/api/history`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact_id: contactId }),
  });
}