import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { toNodeHandler } from "better-auth/node";
import express from "ultimate-express";
import { WebSocketServer } from "ws";
import { defineApiKeyAuthMiddleware } from "#api/middleware/api-key-auth.ts";
import { defineAppContext } from "#api/primitives/app-context.ts";
import type { Container } from "#api/primitives/container.ts";
import { loadAndRegisterAPIRoutes } from "#api/primitives/openapi.ts";
import { updatePaymentStatusRandom } from "#api/services/payments.ts";
import { appRouter } from "#api/trpc/index.ts";
import { ee } from "#api/trpc/init.ts";

let backgroundLoopStarted = false;

function startBackgroundLoop(container: Container) {
	if (backgroundLoopStarted) return;
	backgroundLoopStarted = true;

	const loop = () => {
		const delay = 10000 + Math.floor(Math.random() * 5000);
		setTimeout(async () => {
			const payment = await updatePaymentStatusRandom(container);
			if (payment) {
				ee.emit("paymentResolved", payment);
			}
			loop();
		}, delay);
	};
	loop();
}

/**
 * Raw body middleware for webhook signature verification.
 */
function rawBodyMiddleware(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) {
	if (req.url.includes("/webhooks/")) {
		let data = "";
		req.setEncoding("utf8");
		req.on("data", (chunk: string) => {
			data += chunk;
		});
		req.on("end", () => {
			(req as any).rawBody = Buffer.from(data);
			next();
		});
	} else {
		next();
	}
}
/**
 * Create and start the Express server with all middleware and routes.
 */
export async function createServer(container: Container): Promise<void> {
	const app = express();
	const wss = new WebSocketServer({
		port: 3002,
	});
	const handler = applyWSSHandler({
		wss,
		router: appRouter,
		createContext: async ({ req }) => {
			return defineAppContext({
				apiKey: null,
				container,
				request: req,
				fetchSession: true,
			});
		},
	});

	app.locals.container = container;
	app.set("trust proxy", true);
	app
		.use(rawBodyMiddleware)
		.use(express.json({ limit: "1mb" }))
		.use((req, res, next) => {
			const origin = req.headers.origin;
			if (origin === container.config.DASHBOARD_URL) {
				res.setHeader("Access-Control-Allow-Origin", origin);
				res.setHeader("Access-Control-Allow-Credentials", "true");
				res.setHeader(
					"Access-Control-Allow-Methods",
					"GET, POST, PUT, PATCH, DELETE, OPTIONS",
				);
				res.setHeader(
					"Access-Control-Allow-Headers",
					"Content-Type, Authorization, X-Api-Key",
				);
			}

			if (req.method === "OPTIONS") {
				res.status(204).end();
				return;
			}

			next();
		})
		.all("/auth/*", toNodeHandler(container.auth))
		.use(
			"/v1",
			defineApiKeyAuthMiddleware({
				container,
				skipPaths: [/^\/v1\/webhooks\//],
			}),
		);

	await loadAndRegisterAPIRoutes(app);

	app.use(
		"/trpc",
		createExpressMiddleware({
			router: appRouter,
			createContext: async ({ req }) => {
				return defineAppContext({
					apiKey: null,
					container,
					request: req,
					fetchSession: true,
				});
			},
		}),
	);

	app.get("/health", (req, res) => {
		res.json({ status: "ok" });
	});

	app.use(
		(
			err: Error,
			req: express.Request,
			res: express.Response,
			next: express.NextFunction,
		) => {
			container.logger.error(err, "Unhandled error");
			res.status(500).json({ error: "Internal server error" });
		},
	);

	const { HOST, PORT } = container.config;
	app.listen(PORT, HOST, () => {
		container.logger.info(`Server running at http://${HOST}:${PORT}`);
		startBackgroundLoop(container);
	});

	wss.on("connection", (ws) => {
		console.log(`➕➕ Connection (${wss.clients.size})`);
		ws.once("close", () => {
			console.log(`➖➖ Connection (${wss.clients.size})`);
		});
	});
	process.on("SIGTERM", () => {
		console.log("SIGTERM");
		handler.broadcastReconnectNotification();
		wss.close();
	});
}
