"use client";

import { useState } from "react";
interface Props {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export default function ProviderSelect({ value, onChange, className }: Props) {
	const [customProviders, setCustomProviders] = useState<string[]>([]);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customInput, setCustomInput] = useState("");

	const allProviders = [...customProviders];

	function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
		if (e.target.value === "__add_new__") {
			setShowCustomInput(true);
		} else {
			onChange(e.target.value);
		}
	}

	function handleAddCustom() {
		if (!customInput.trim()) return;
		const newProvider = customInput.trim();
		setCustomProviders((prev) => [...prev, newProvider]);
		onChange(newProvider);
		setCustomInput("");
		setShowCustomInput(false);
	}

	return (
		<div className="space-y-2">
			<select value={value} onChange={handleChange} className={className}>
				<option value="">Select provider</option>
				{allProviders.map((p) => (
					<option key={p} value={p}>
						{p}
					</option>
				))}
				<option value="__add_new__">+ Add new provider</option>
			</select>
			{showCustomInput && (
				<div className="flex gap-2">
					<input
						type="text"
						value={customInput}
						onChange={(e) => setCustomInput(e.target.value)}
						placeholder="Provider name"
						className={className}
						onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
					/>
					<button
						type="button"
						onClick={handleAddCustom}
						className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
					>
						Add
					</button>
					<button
						type="button"
						onClick={() => setShowCustomInput(false)}
						className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
					>
						Cancel
					</button>
				</div>
			)}
		</div>
	);
}
