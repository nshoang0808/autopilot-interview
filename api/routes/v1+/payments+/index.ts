import { z } from "zod";
import {
  defineOpenAPI,
  defineOpenAPIEndpoint,
} from "#api/primitives/openapi.ts";
import { createPayment } from "#api/services/payments.ts";

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
