import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createWSClient,
	httpBatchLink,
	loggerLink,
	splitLink,
	wsLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "#api/trpc/index.ts";

/**
 * The tRPC React client.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * The tRPC provider.
 */
export function TRPCProvider({
	children,
	url,
}: {
	children: React.ReactNode;
	url: string;
}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					mutations: {
						retry: false,
					},
					queries: {
						gcTime: 60 * 1000,
						refetchOnWindowFocus: false,
						refetchOnReconnect: true,
						refetchOnMount: true,
						retry: false,
						staleTime: 0,
					},
				},
			}),
	);
	const wsClient = createWSClient({
		url: "ws://localhost:3002/trpc",
	});
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV !== "production" ||
						(opts.direction === "down" && opts.result instanceof Error),
				}),
				splitLink({
					condition: (op) => {
						return op.type === "subscription";
					},
					true: wsLink({
						client: wsClient,
						transformer: superjson,
					}),
					false: httpBatchLink({
						transformer: superjson,
						url,
						fetch(url, options) {
							return fetch(url, {
								...options,
								credentials: "include",
							});
						},
					}),
				}),
			],
		}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
