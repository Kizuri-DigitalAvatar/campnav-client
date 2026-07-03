"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type MediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;

export type ExtractedMenuItem = {
    name: string;
    mealType: string;
    description: string;
};

const MENU_ITEMS_SCHEMA = {
    type: "object",
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The dish or item name" },
                    mealType: { type: "string", enum: [...MEAL_TYPES] },
                    description: {
                        type: "string",
                        description: "Short description including price if shown; empty string if none",
                    },
                },
                required: ["name", "mealType", "description"],
                additionalProperties: false,
            },
        },
    },
    required: ["items"],
    additionalProperties: false,
};

export const extractMenuItems = action({
    args: { storageId: v.string() },
    handler: async (ctx, args): Promise<ExtractedMenuItem[]> => {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error(
                "Menu scanning is not configured. Set ANTHROPIC_API_KEY in the Convex dashboard (Settings > Environment Variables)."
            );
        }

        const url = await ctx.storage.getUrl(args.storageId as any);
        if (!url) throw new Error("Uploaded image not found");

        const res = await fetch(url);
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        const mediaType: MediaType = (SUPPORTED_MEDIA_TYPES as readonly string[]).includes(contentType)
            ? (contentType as MediaType)
            : "image/jpeg";
        const data = Buffer.from(await res.arrayBuffer()).toString("base64");

        const client = new Anthropic();
        const response = await client.messages.create({
            model: "claude-opus-4-8",
            max_tokens: 8192,
            output_config: {
                format: { type: "json_schema", schema: MENU_ITEMS_SCHEMA },
            },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "image", source: { type: "base64", media_type: mediaType, data } },
                        {
                            type: "text",
                            text: "Extract every menu item from this image. For each item give its name, classify it as breakfast, lunch, dinner, snack, or drink (use the menu's section headings when present), and write a short description including the price if one is shown.",
                        },
                    ],
                },
            ],
        });

        const text = response.content.find((block) => block.type === "text");
        if (!text || text.type !== "text") {
            throw new Error("Could not read any menu items from the image. Try a clearer photo or enter items manually.");
        }

        const parsed = JSON.parse(text.text) as { items: ExtractedMenuItem[] };
        if (!parsed.items?.length) {
            throw new Error("No menu items were found in the image. Try a clearer photo or enter items manually.");
        }
        return parsed.items;
    },
});
