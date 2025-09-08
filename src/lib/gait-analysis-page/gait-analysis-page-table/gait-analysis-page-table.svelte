<script lang="ts">
	import { cn } from "$lib/utils";
	import type { TableRowType } from "./gait-analysis-page-table.type";

	export let data: TableRowType[] = [];
	let className = "";
	export { className as class };
</script>

<table
	class={cn(
		"border border-collapse border-gray-400 [&_td]:border [&_td]:border-gray-400 [&_td]:p-2 [&_td]:text-center",
		className,
	)}
>
	<thead>
		<tr>
			<td>Session</td>
			<td>Date Time</td>
			<td>Leg</td>
			<td>ROM (deg)</td>
			<td>Stride Time (s)</td>
			<td>Swing Time (s)</td>
			<td>Stance Time (s)</td>
			<td>Cadence (step/min)</td>
			<td>Step Length (m)</td>
			<td>Symmetry (%)</td>
		</tr>
	</thead>
	<tbody>
		{#each data as row, index}
			<tr>
				<td rowspan="2">
					{index + 1}
				</td>
				<td rowspan="2">
					{row.date}
				</td>
				<td> Left </td>
				<td>
					{row.leftRom}
				</td>
				<td>
					{row.leftStrideTime}
				</td>
				<td>
					{row.leftSwingTime}
				</td>
				<td>
					{row.leftStanceTime}
				</td>
				<td rowspan="2">
					{row.cadence}
				</td>
				<td>
					{row.leftStepLength}
				</td>
				<td rowspan="2">
					{row.symmetry}
				</td>
			</tr>
			<tr>
				<td> Right </td>
				<td>
					{row.rightRom}
				</td>
				<td>
					{row.rightStrideTime}
				</td>
				<td>
					{row.rightSwingTime}
				</td>
				<td>
					{row.rightStanceTime}
				</td>
				<td>
					{row.rightStepLength}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
