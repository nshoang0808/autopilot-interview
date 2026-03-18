import { z } from "zod";
import {
  defineOpenAPI,
  defineOpenAPIEndpoint,
} from "#api/primitives/openapi.ts";
import { createPayment, getPaymentsByUser } from "#api/services/payments.ts";

const PaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  recipientEmail: z.string().email(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

const PaymentListSchema = z.array(PaymentSchema);

const CreatePaymentRequestSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().optional(),
  method: z.enum(["card", "bank_transfer"]),
  description: z.string().nullable().optional(),
});
/**
 * OpenAPI route for external API access via API key.
 */
export default defineOpenAPI({
    GET: defineOpenAPIEndpoint({
      summary: "Get list payments by user",
      responses: {
        200: { description: "List Payment found", schema: PaymentListSchema },
        401: {
          description: "Unauthorized",
          schema: z.object({ error: z.string() }),
        },
        404: {
          description: "Payment not found",
          schema: z.object({ error: z.string() }),
        },
      },
      async handler({ ctx, response }) {
        if (!ctx.apiKey) {
          return response.unauthorized({ error: "API key required" });
        }
        const userId = ctx.apiKey.userId;
        const payments = await getPaymentsByUser(ctx, userId);
        return response.ok(payments);
      },
    }),
    POST: defineOpenAPIEndpoint({
      summary: "Create payment",
      requestBody: CreatePaymentRequestSchema,
      responses: {
        200: {
          description: "Payment created",
          schema: z.object({
            payment_id: z.string(),
            status: z.enum(["pending", "processing", "completed", "failed"]),
          }),
        },
        401: {
          description: "Unauthorized",
          schema: z.object({ error: z.string() }),
        },
      },
      async handler({ ctx, body, response }) {
        if (!ctx.apiKey) {
          return response.unauthorized({ error: "API key required" });
        }
        const payment = await createPayment(ctx, { ...body, userId: ctx.apiKey.userId });
        return response.ok({ payment_id: payment.id, status: payment.status });
      },
    }),
});
