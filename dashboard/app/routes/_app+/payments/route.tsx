/**
 * Payments page component.
 *
 * CANDIDATE TODO: Implement the following:
 * 1. Form with inputs: amount (dollars), recipientEmail, description
 * 2. Submit button that calls trpc.payments.create.useMutation()
 * 3. Table showing payments from trpc.payments.list.useQuery()
 *
 * Hints:
 * - Amount input is in dollars (user-friendly), convert to cents (* 100) before sending
 * - After mutation succeeds, call utils.payments.list.invalidate() to refresh
 * - Show loading state with isLoading from useQuery
 *
 * Example patterns:
 * ```typescript
 * const utils = trpc.useUtils();
 * const { data: payments, isLoading } = trpc.payments.list.useQuery();
 * const createMutation = trpc.payments.create.useMutation({
 *   onSuccess: () => utils.payments.list.invalidate(),
 * });
 *
 * // Form state
 * const [amount, setAmount] = useState("");
 * const [recipientEmail, setRecipientEmail] = useState("");
 * const [description, setDescription] = useState("");
 *
 * // Submit handler
 * const handleSubmit = (e: React.FormEvent) => {
 *   e.preventDefault();
 *   createMutation.mutate({
 *     amount: Math.round(parseFloat(amount) * 100), // Convert to cents
 *     recipientEmail,
 *     description: description || undefined,
 *   });
 * };
 * ```
 */
export default function PaymentsPage() {
	// TODO: Implement

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Payments</h1>
				<p className="mt-1 text-sm text-gray-500">
					Create and manage your payments
				</p>
			</div>

			{/* TODO: Add create payment form */}
			<div className="rounded-lg border bg-white p-6">
				<h2 className="text-lg font-medium">Create Payment</h2>
				<p className="mt-2 text-sm text-gray-500">
					Implement the payment creation form here
				</p>
				{/* Form goes here */}
			</div>

			{/* TODO: Add payments table */}
			<div className="rounded-lg border bg-white p-6">
				<h2 className="text-lg font-medium">Payment History</h2>
				<p className="mt-2 text-sm text-gray-500">
					Implement the payments table here
				</p>
				{/* Table goes here */}
			</div>
		</div>
	);
}
