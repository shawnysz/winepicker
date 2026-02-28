import Anthropic from "@anthropic-ai/sdk";

export interface LabelReadResult {
  producer: string | null;
  wineName: string | null;
  vintage: number | null;
  appellation: string | null;
  classification: string | null;
  confidence: number;
  rawText: string;
}

export async function readWineLabel(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg"
): Promise<LabelReadResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analyze this wine label image. Extract the following information and return it as JSON only (no markdown, no code blocks):

{
  "producer": "the producer/domaine name",
  "wine_name": "the full wine name including vineyard if shown",
  "vintage": 2020,
  "appellation": "the appellation (e.g., Chambolle-Musigny 1er Cru)",
  "classification": "Grand Cru, Premier Cru, Village, or Regional",
  "confidence": 0.95,
  "raw_text": "all text visible on the label"
}

Focus on Burgundy wine terminology. If you can't determine a field, use null.
The confidence should reflect how certain you are about the extraction (0-1).`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return {
      producer: parsed.producer || null,
      wineName: parsed.wine_name || null,
      vintage: parsed.vintage ? parseInt(parsed.vintage) : null,
      appellation: parsed.appellation || null,
      classification: parsed.classification || null,
      confidence: parsed.confidence || 0,
      rawText: parsed.raw_text || "",
    };
  } catch {
    return {
      producer: null,
      wineName: null,
      vintage: null,
      appellation: null,
      classification: null,
      confidence: 0,
      rawText: text,
    };
  }
}
