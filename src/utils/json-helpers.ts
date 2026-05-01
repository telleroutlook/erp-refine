/** Strip markdown code fences from LLM output before JSON.parse */
export function stripJsonFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
