import { eq } from "drizzle-orm";
import { payments, users } from "#api/databases/schema.ts";
import type { AppContext } from "#api/primitives/app-context.ts";

/**
 * Get a payment by ID. Returns the payment if found, null otherwise.
 */
export async function getPaymentById(ctx: AppContext, paymentId: string) {
	const payment = await ctx.container.db
		.select()
		.from(payments)
		.where(eq(payments.id, paymentId))
		.limit(1)
		.then((rows) => rows[0]);

	return payment ?? null;
}

export type CreatePaymentInput = {
  userId: string;
	amount: number;
	currency?: string;
	method: "card" | "bank_transfer";
	description?: string | null;
};

/**
 * Create a new pending payment.
 */
export async function createPayment(ctx: AppContext, input: CreatePaymentInput) {
  let recipientEmail: string;
  if (!ctx.user) {
    const user = await ctx.container.db
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1)
      .then((rows) => rows[0]);
    recipientEmail = user.email
  } else {
    recipientEmail = ctx.user.email;
  }
	const [payment] = await ctx.container.db
		.insert(payments)
		.values({
			amount: input.amount,
			currency: input.currency ?? "USD",
			method: input.method,
			recipientEmail,
			description: input.description ?? null,
			status: "pending",
			createdBy: input.userId,
		})
		.returning();

	return payment;
}
