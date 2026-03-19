import { trpc } from "#dashboard/app/lib/trpc.tsx";

type Payment = {
	id: string;
	amount: number;
	currency: string;
	method: string;
	status: string;
};

export function PaymentsTable() {
	const utils = trpc.useUtils();
	const { data: payments, isLoading } = trpc.payments.listByUser.useQuery();
	trpc.payments.onPaymentResolved.useSubscription(undefined, {
		onData: (payment) => {
			utils.payments.listByUser.setData(undefined, (old) => {
				if (!old) return old;
				console.log("payment update incoming:", old);
				return old.map((p) => (p.id === payment.id ? payment : p));
			});
		},
		onError: (err) => {
			console.error("Payment notification error:", err);
		},
	});

	return (
		<div>
			<h3 className="text-sm font-medium text-gray-900">Payment history</h3>
			{isLoading ? (
				<p className="mt-2 text-sm text-gray-500">Loading payments...</p>
			) : !payments || payments.length === 0 ? (
				<p className="mt-2 text-sm text-gray-500">No payments yet.</p>
			) : (
				<div className="mt-2 overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-3 py-2 text-left font-medium text-gray-500">
									ID
								</th>
								<th className="px-3 py-2 text-right font-medium text-gray-500">
									Amount
								</th>
								<th className="px-3 py-2 text-left font-medium text-gray-500">
									Currency
								</th>
								<th className="px-3 py-2 text-left font-medium text-gray-500">
									Method
								</th>
								<th className="px-3 py-2 text-left font-medium text-gray-500">
									Status
								</th>
								<th className="px-3 py-2 text-right font-medium text-gray-500">
									Detail
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 bg-white">
							{payments.map((payment) => (
								<tr key={payment.id}>
									<td className="px-3 py-2 text-xs text-gray-500">
										{payment.id}
									</td>
									<td className="px-3 py-2 text-right">
										{(payment.amount / 100).toFixed(2)}
									</td>
									<td className="px-3 py-2">{payment.currency}</td>
									<td className="px-3 py-2">{payment.method}</td>
									<td className="px-3 py-2">{payment.status}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
