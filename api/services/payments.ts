import { desc, eq } from "drizzle-orm";
import { payments, users } from "#api/databases/schema.ts";
import type { AppContext } from "#api/primitives/app-context.ts";
import type { Container } from "#api/primitives/container.ts";

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
export async function createPayment(
	ctx: AppContext,
	input: CreatePaymentInput,
) {
	let recipientEmail: string;
	if (!ctx.user) {
		const user = await ctx.container.db
			.select()
			.from(users)
			.where(eq(users.id, input.userId))
			.limit(1)
			.then((rows) => rows[0]);
		recipientEmail = user.email;
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

/**
 * Get all payments created by a specific user.
 */
export async function getPaymentsByUser(ctx: AppContext, userId: string) {
	const userPayments = await ctx.container.db
		.select()
		.from(payments)
		.where(eq(payments.createdBy, userId))
		.orderBy(desc(payments.updatedAt));

	return userPayments;
}

export async function updatePaymentStatusRandom(container: Container) {
	const payment = await container.db
		.select({ id: payments.id })
		.from(payments)
		.where(eq(payments.status, "pending"))
		.limit(1)
		.then((rows) => rows[0]);

	if (!payment) return null;

	const newStatus = Math.random() < 0.5 ? "settled" : "failed";
	const [updated] = await container.db
		.update(payments)
		.set({ status: newStatus })
		.where(eq(payments.id, payment.id))
		.returning();

	return updated ?? null;
}
