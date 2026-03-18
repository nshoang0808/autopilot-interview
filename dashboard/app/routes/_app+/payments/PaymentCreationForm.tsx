import { useState } from "react";
import { trpc } from "#dashboard/app/lib/trpc.tsx";
import { Button } from "#assets/components/ui/button.tsx";

export enum PaymentMethod {
  Card = "card",
  BankTransfer = "bank_transfer",
}

export function PaymentCreationForm() {
	const utils = trpc.useUtils();

	const { data: payments, isLoading } = trpc.payments.listByUser.useQuery();
	const [amount, setAmount] = useState("0");
	const [currency, setCurrency] = useState("USD");
	const [method, setMethod] = useState("");

	const createMutation = trpc.payments.create.useMutation({
		onSuccess: () => {
			utils.payments.listByUser.invalidate();
			setAmount("0");
      setCurrency("USD");
      setMethod("");
		},
	});

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		const parsedAmount = parseInt(amount);
		if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
			return;
		}

		createMutation.mutate({
			amount: Math.round(parsedAmount * 100),
			currency,
      method: PaymentMethod.Card,
		});
	};

	return (
		<div className="space-y-8">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Amount
					</label>
					<input
						type="number"
						step="1"
						min="0"
						value={amount}
						onChange={(event) => setAmount(event.target.value)}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">
						Currency
					</label>
					<input
						type="text"
						value={currency}
						onChange={(event) => setCurrency(event.target.value)}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">
						Method
					</label>
					<select
						value={method}
						onChange={(event) => setMethod(event.target.value)}
						className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					>
						<option value="">Select a method</option>
						<option value={PaymentMethod.Card}>Card</option>
						<option value={PaymentMethod.BankTransfer}>Bank transfer</option>
					</select>
				</div>

				<Button type="submit" disabled={createMutation.isPending}>
					{createMutation.isPending ? "Creating..." : "Create payment"}
				</Button>

				{createMutation.error ? (
					<p className="text-sm text-red-600">
						{createMutation.error.message}
					</p>
				) : null}
			</form>
		</div>
	);
}

