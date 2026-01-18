import { query } from "./_generated/server";
import { v } from "convex/values";

export const global = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const searchTerm = args.query.toLowerCase();
        if (!searchTerm) {
            return {
                products: [],
                announcements: [],
                activities: [],
            };
        }

        // Search Products
        const allProducts = await ctx.db.query("products").collect();
        const products = allProducts.filter(
            (p) =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
        );

        // Get image URLs for products
        const productsWithImages = await Promise.all(
            products.map(async (p) => {
                let imageUrl = null;
                if (p.image) {
                    if (p.image.startsWith("http")) {
                        imageUrl = p.image;
                    } else {
                        try {
                            imageUrl = await ctx.storage.getUrl(p.image);
                        } catch (e) {
                            imageUrl = null;
                        }
                    }
                }
                return { ...p, imageUrl };
            })
        );

        // Search Announcements
        const allAnnouncements = await ctx.db.query("announcements").collect();
        const announcements = allAnnouncements.filter(
            (a) =>
                a.title.toLowerCase().includes(searchTerm) ||
                a.content.toLowerCase().includes(searchTerm)
        );

        // Get image URLs for announcements
        const announcementsWithImages = await Promise.all(
            announcements.map(async (a) => {
                let coverImageUrl = null;
                if (a.coverImage) {
                    if (a.coverImage.startsWith("http")) {
                        coverImageUrl = a.coverImage;
                    } else {
                        try {
                            coverImageUrl = await ctx.storage.getUrl(a.coverImage);
                        } catch (e) {
                            coverImageUrl = null;
                        }
                    }
                }
                return { ...a, coverImageUrl };
            })
        );

        // Search Activities
        const allActivities = await ctx.db.query("activities").collect();
        const activities = allActivities.filter(
            (a) =>
                a.title.toLowerCase().includes(searchTerm) ||
                a.description.toLowerCase().includes(searchTerm) ||
                a.location.toLowerCase().includes(searchTerm)
        );

        return {
            products: productsWithImages,
            announcements: announcementsWithImages,
            activities: activities,
        };
    },
});
