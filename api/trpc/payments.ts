import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import {
	createPayment,
	getPaymentById,
	getPaymentsByUser,
} from "#api/services/payments.ts";
import { ee } from "#api/trpc/init.ts";
import { protectedProcedure, publicProcedure, router } from "./init.ts";

const CreatePaymentRequestSchema = z.object({
	amount: z.number().int().positive(),
	currency: z.string().optional(),
	method: z.enum(["card", "bank_transfer"]),
	description: z.string().nullable().optional(),
});

/**
 * Payments router for dashboard internal use.
 */
export const paymentsRouter = router({
	/**
	 * Get a payment by ID.
	 * Only returns the payment if the authenticated user owns it.
	 */
	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const payment = await getPaymentById(ctx, input.id);

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Ensure user owns this payment.
			if (payment.createdBy !== ctx.user.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			return payment;
		}),
	/**
	 * List payments by user.
	 */
	listByUser: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.id;
		return await getPaymentsByUser(ctx, userId);
	}),

	create: protectedProcedure
		.input(CreatePaymentRequestSchema)
		.mutation(async ({ ctx, input }) => {
			const payment = await createPayment(ctx, {
				userId: ctx.user.id,
				amount: input.amount,
				currency: input.currency,
				method: input.method,
				description: input.description,
			});
			return payment;
		}),

	/**
	 * Scheduler to resolve payments
	 */
	onPaymentResolved: publicProcedure.subscription(() => {
		return observable<any>((emit) => {
			const onPaymentResolved = (payment: any) => {
				emit.next(payment);
			};
			ee.on("paymentResolved", onPaymentResolved);
		});
	}),
});
