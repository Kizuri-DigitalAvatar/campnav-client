import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createInvoice = mutation({
  args: {
    userId: v.id("users"),
    period: v.string(), // "monthly", "weekly"
    startDate: v.number(),
    endDate: v.number(),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate totals
    const subtotal = args.items.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const total = subtotal + tax;

    const invoiceNumber = generateInvoiceNumber();

    return await ctx.db.insert("invoices", {
      userId: args.userId,
      invoiceNumber,
      period: args.period,
      startDate: args.startDate,
      endDate: args.endDate,
      items: args.items,
      subtotal,
      tax,
      total,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

export const updateInvoiceStatus = mutation({
  args: {
    invoiceId: v.id("invoices"),
    status: v.string(), // "draft", "sent", "paid", "overdue"
    paymentMethod: v.optional(v.string()), // "cash", "card", "transfer"
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const updateData: any = { status: args.status };

    if (args.status === "paid") {
      updateData.paidAt = Date.now();
      updateData.paymentMethod = args.paymentMethod;
    }

    await ctx.db.patch(args.invoiceId, updateData);
    return await ctx.db.get(args.invoiceId);
  },
});

export const getInvoices = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = args.userId
      ? ctx.db.query("invoices").withIndex("by_userId", (q) => q.eq("userId", args.userId!))
      : args.status
        ? ctx.db.query("invoices").withIndex("by_status", (q) => q.eq("status", args.status!))
        : ctx.db.query("invoices");

    if (args.userId && args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.period) {
      query = query.filter((q) => q.eq(q.field("period"), args.period));
    }
    
    const invoices = await query.order("desc").collect();
    
    // Enrich with user information
    return Promise.all(
      invoices.map(async (invoice) => {
        const user = await ctx.db.get(invoice.userId);
        return {
          ...invoice,
          userName: user?.name || "Unknown",
          userRoom: user?.roomNumber || "N/A",
        };
      })
    );
  },
});

export const getBillingStats = query({
  args: {
    period: v.optional(v.string()), // "monthly", "weekly"
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startDate = args.startDate || monthStart;
    const endDate = args.endDate || Date.now();
    
    let query = ctx.db
      .query("invoices")
      .filter((q) => 
        q.and(
          q.gte(q.field("startDate"), startDate),
          q.lte(q.field("endDate"), endDate)
        )
      );
    
    if (args.period) {
      query = query.filter((q) => q.eq(q.field("period"), args.period));
    }
    
    const invoices = await query.collect();
    
    const totalInvoices = invoices.length;
    const draftInvoices = invoices.filter(i => i.status === "draft").length;
    const sentInvoices = invoices.filter(i => i.status === "sent").length;
    const paidInvoices = invoices.filter(i => i.status === "paid").length;
    const overdueInvoices = invoices.filter(i => 
      i.status === "sent" && 
      new Date(i.endDate).getTime() < Date.now() - (30 * 24 * 60 * 60 * 1000)
    ).length;
    
    // Financial calculations
    const totalRevenue = invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0);
    
    const outstandingRevenue = invoices
      .filter(i => i.status === "sent")
      .reduce((sum, i) => sum + i.total, 0);
    
    const totalTax = invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.tax, 0);
    
    // Cost per head calculation
    const users = await ctx.db.query("users").collect();
    const activeUsers = users.filter(user => 
      user.role === "resident" || 
      (user.durationStart && user.durationStart <= Date.now() && 
       (!user.durationEnd || user.durationEnd >= Date.now()))
    ).length;
    
    const costPerHead = activeUsers > 0 ? Math.round(totalRevenue / activeUsers * 100) / 100 : 0;
    
    // Period comparison
    const periodStats = invoices.reduce((acc, invoice) => {
      const period = invoice.period;
      if (!acc[period]) {
        acc[period] = {
          count: 0,
          revenue: 0,
          tax: 0,
        };
      }
      acc[period].count++;
      if (invoice.status === "paid") {
        acc[period].revenue += invoice.total;
        acc[period].tax += invoice.tax;
      }
      return acc;
    }, {} as Record<string, { count: number; revenue: number; tax: number }>);
    
    return {
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      outstandingRevenue,
      totalTax,
      activeUsers,
      costPerHead,
      paymentRate: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0,
      periodStats,
    };
  },
});

export const getCostPerHeadAnalysis = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .filter((q) => 
        q.and(
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("endDate"), args.endDate)
        )
      )
      .collect();
    
    const users = await ctx.db.query("users").collect();
    
    // Calculate daily active users for each day in the period
    const dailyActiveUsers: Record<string, number> = {};
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (let date = args.startDate; date <= args.endDate; date += dayInMs) {
      const activeCount = users.filter(user => 
        user.role === "resident" || 
        (user.durationStart && user.durationStart <= date && 
         (!user.durationEnd || user.durationEnd >= date))
      ).length;
      
      dailyActiveUsers[new Date(date).toDateString()] = activeCount;
    }
    
    // Calculate cost per head for each invoice
    const costAnalysis = invoices
      .filter(invoice => invoice.status === "paid")
      .map(invoice => {
        const invoiceDate = new Date(invoice.startDate);
        const dayKey = invoiceDate.toDateString();
        const activeUsersOnDay = dailyActiveUsers[dayKey] || 0;
        const costPerHead = activeUsersOnDay > 0 ? Math.round((invoice.total / activeUsersOnDay) * 100) / 100 : 0;
        
        return {
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.startDate,
          total: invoice.total,
          activeUsers: activeUsersOnDay,
          costPerHead,
        };
      });
    
    return {
      dailyActiveUsers,
      costAnalysis,
      averageCostPerHead: costAnalysis.length > 0 
        ? Math.round(costAnalysis.reduce((sum, item) => sum + item.costPerHead, 0) / costAnalysis.length * 100) / 100 
        : 0,
      totalRevenue: invoices.reduce((sum, i) => sum + i.total, 0),
      periodStart: args.startDate,
      periodEnd: args.endDate,
    };
  },
});

export const generateInvoiceReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    format: v.string(), // "pdf", "excel"
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .filter((q) => 
        q.and(
          q.gte(q.field("startDate"), args.startDate),
          q.lte(q.field("endDate"), args.endDate)
        )
      )
      .collect();
    
    // Generate report data
    const reportData = {
      period: {
        start: new Date(args.startDate).toLocaleDateString(),
        end: new Date(args.endDate).toLocaleDateString(),
      },
      summary: {
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, i) => sum + i.total, 0),
        totalTax: invoices.reduce((sum, i) => sum + i.tax, 0),
        paidInvoices: invoices.filter(i => i.status === "paid").length,
        outstandingInvoices: invoices.filter(i => i.status === "sent").length,
      },
      invoices: invoices.map(invoice => ({
        invoiceNumber: invoice.invoiceNumber,
        period: invoice.period,
        startDate: new Date(invoice.startDate).toLocaleDateString(),
        endDate: new Date(invoice.endDate).toLocaleDateString(),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        status: invoice.status,
        paidAt: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : null,
      })),
    };
    
    return reportData;
  },
});

// Helper function to generate invoice numbers
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}-${month}-${random}`;
}
