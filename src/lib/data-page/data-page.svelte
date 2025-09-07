<script lang="ts">
	import { onMount } from "svelte";
	import { data } from "./data.json";
	import { detrend, findPeaks, ptp, radians } from "$lib/scijs/scijs";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Button } from "$lib/components/ui/button/index";
	import { LineChart } from "layerchart";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
	import { scaleUtc } from "d3-scale";
	import { curveLinear } from "d3-shape";
	import * as Chart from "$lib/components/ui/chart/index.js";

	let progress = 0;
	let loading = false;
	let dataAvailable = false;

	type GaitData = {
		Date: string;
		callback_time: number[];
		SMCmr_pos: number[];
		SMCmr_vel: number[];
		SMCml_pos: number[];
		SMCml_vel: number[];
	};

	type ResultType = {
		ROM: number;
		"Stride Time (s)": number;
		"Swing Time (s)": number;
		"Stance Time (s)": number;
	};

	type SummaryType = {
		rightSummary: ResultType;
		leftSummary: ResultType;
		Cadence: number;
		"Step Length (m)": {
			Left: number;
			Right: number;
		};
		Symmetry: number;
	};

	type ChartData = {
		rightROM: number;
		rightStrideTime: number;
		rightSwingTime: number;
		rightStanceTime: number;
		rightStepLength: number;
		leftROM: number;
		leftStrideTime: number;
		leftSwingTime: number;
		leftStanceTime: number;
		leftStepLength: number;
		Cadence: number;
		Symmetry: number;
		Date: Date;
	};

	type TableRowType = SummaryType & { Date: string };

	const summary: SummaryType[] = [];
	let chartData: ChartData[] = [];

	const diff = (data: number[]) => {
		if (data.length <= 1) return [];
		const diff = new Array<number>(data.length - 1);
		for (let i = 0; i < data.length - 1; i++) {
			diff[i] = data[i + 1] - data[i];
		}
		return diff;
	};

	const mean = (data: number[]) => {
		const sum = data.reduce(
			(prevValue, currentValue) => currentValue + prevValue,
			0,
		);
		return sum / data.length;
	};

	const arange = (start: number, stop: number, step: number = 1) => {
		if (step === 0) throw new Error("Step cannot be zero.");
		const result: number[] = [];
		if (step > 0) {
			for (let i = start; i < stop; i += step) {
				result.push(i);
			}
		} else {
			for (let i = start; i > stop; i += step) {
				result.push(i);
			}
		}
		return result;
	};

	const computeCallbackTime = (data: GaitData, samplingRate = 100) => {
		const callbackTimeMeanDiff = mean(diff(data["callback_time"]));
		if (
			"callback_time" in data &&
			data["callback_time"].length > 1 &&
			callbackTimeMeanDiff > 1e-6
		) {
			const calculatedRate = 1 / callbackTimeMeanDiff;
			if (calculatedRate > 10 && calculatedRate < 1000) {
				samplingRate = calculatedRate;
			}
		}
		data["callback_time"] = arange(0, data["callback_time"].length).map(
			(val) => val / samplingRate,
		);
		return { data, samplingRate };
	};

	const adaptivePeakDetection = (angles: number[], samplingRate: number) => {
		const signalRange = ptp(angles);
		const minProminenceDeg = 5;
		const prominence = Math.max(minProminenceDeg, signalRange * 0.15);
		const minDistSeconds = 0.5;
		const distance = Math.floor(minDistSeconds * samplingRate);
		const maxIndices = findPeaks(angles, prominence, distance);
		const minIndices = findPeaks(
			angles.map((val) => -val),
			prominence,
			distance,
		);
		return [maxIndices.sort((a, b) => a - b), minIndices.sort((a, b) => a - b)];
	};

	const getResultAvg = (data: ResultType[]) => {
		if (data.length == 0) {
			throw Error("data shouldn't be empty");
		}
		const meanResult: ResultType = {
			ROM: 0,
			"Stride Time (s)": 0,
			"Swing Time (s)": 0,
			"Stance Time (s)": 0,
		};
		for (const dataPoint of data) {
			meanResult.ROM += dataPoint.ROM;
			meanResult["Stance Time (s)"] += dataPoint["Stance Time (s)"];
			meanResult["Swing Time (s)"] += dataPoint["Swing Time (s)"];
			meanResult["Stride Time (s)"] += dataPoint["Stride Time (s)"];
		}
		meanResult.ROM /= data.length;
		meanResult["Stance Time (s)"] /= data.length;
		meanResult["Swing Time (s)"] /= data.length;
		meanResult["Stride Time (s)"] /= data.length;
		return meanResult;
	};

	const analysisSingleSession = (
		data: GaitData,
		legLength: number,
		sessionDate: Date,
	) => {
		let samplingRate: number;
		({ data, samplingRate } = computeCallbackTime(data));
		const time = data["callback_time"];
		const rightPosRaw = data["SMCmr_pos"];
		const leftPosRaw = data["SMCml_pos"];
		const rightPosDetrended = detrend(rightPosRaw);
		const leftPosDetrended = detrend(leftPosRaw);
		let [rightMaxIdx, rightMinIdx] = adaptivePeakDetection(
			rightPosDetrended,
			samplingRate,
		);
		const [leftMaxIdx, leftMinIdx] = adaptivePeakDetection(
			leftPosDetrended,
			samplingRate,
		);
		const rightResultData: ResultType[] = [];
		for (let i = 0; i < rightMinIdx.length - 1; i++) {
			const startIdx = rightMinIdx[i];
			const endIdx = rightMinIdx[i + 1];
			const peaksInStride = rightMaxIdx.filter(
				(value) => value > startIdx && value < endIdx,
			);
			if (peaksInStride.length == 1) {
				const peakIdx = peaksInStride[0];
				const strideTime = time[endIdx] - time[startIdx];
				const swingTime = time[endIdx] - time[peakIdx];
				const stanceTime = time[peakIdx] - time[startIdx];
				rightResultData.push({
					ROM: ptp(rightPosRaw.slice(startIdx, endIdx)),
					"Stride Time (s)": strideTime,
					"Swing Time (s)": swingTime,
					"Stance Time (s)": stanceTime,
				});
			}
		}
		const leftResultData: ResultType[] = [];
		for (let i = 0; i < leftMinIdx.length - 1; i++) {
			const startIdx = leftMinIdx[i];
			const endIdx = leftMinIdx[i + 1];
			const peaksInStride = leftMaxIdx.filter(
				(value) => value > startIdx && value < endIdx,
			);
			if (peaksInStride.length == 1) {
				const peakIdx = peaksInStride[0];
				const strideTime = time[endIdx] - time[startIdx];
				const swingTime = time[endIdx] - time[peakIdx];
				const stanceTime = time[peakIdx] - time[startIdx];
				leftResultData.push({
					ROM: ptp(leftPosRaw.slice(startIdx, endIdx)),
					"Stride Time (s)": strideTime,
					"Swing Time (s)": swingTime,
					"Stance Time (s)": stanceTime,
				});
			}
		}
		const resultData = leftResultData.concat(rightResultData);
		if (resultData.length == 0) {
			console.warn(`Warning: No valid steps detected for . Skipping.`);
			return null;
		}

		const leftSummary = getResultAvg(leftResultData);
		const rightSummary = getResultAvg(rightResultData);

		const totalSteps = resultData.length;
		const totalTimeMinutes = (time[time.length - 1] - time[0]) / 60;
		const summary: SummaryType = {
			leftSummary,
			rightSummary,
			"Step Length (m)": {
				Left: legLength * radians(leftSummary.ROM),
				Right: legLength * radians(rightSummary.ROM),
			},
			Symmetry:
				(1 -
					Math.abs(rightSummary.ROM - leftSummary.ROM) /
						(0.5 * (rightSummary.ROM + leftSummary.ROM))) *
				100,
			Cadence: totalTimeMinutes > 0 ? totalSteps / totalTimeMinutes : 0,
		};
		return summary;
	};

	function roundTo(num: number, decimals = 2) {
		return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
	}

	const makeChartData = (tableData: TableRowType[]) => {
		const chartData: ChartData[] = [];
		for (const row of tableData) {
			chartData.push({
				Cadence: row.Cadence,
				leftROM: row.leftSummary.ROM,
				leftStrideTime: row.leftSummary["Stride Time (s)"],
				leftStanceTime: row.leftSummary["Stance Time (s)"],
				leftSwingTime: row.leftSummary["Swing Time (s)"],
				leftStepLength: row["Step Length (m)"].Left,
				rightROM: row.rightSummary.ROM,
				rightStrideTime: row.rightSummary["Stride Time (s)"],
				rightStanceTime: row.rightSummary["Stance Time (s)"],
				rightSwingTime: row.rightSummary["Swing Time (s)"],
				rightStepLength: row["Step Length (m)"].Right,
				Symmetry: row.Symmetry,
				Date: new Date(row.Date),
			});
		}
		return chartData;
	};

	const formatTableData = (tableData: TableRowType[]) => {
		// rightSummary: ResultType;
		// leftSummary: ResultType;
		// Cadence: number;
		// "Step Length (m)": {
		// 	Left: number;
		// 	Right: number;
		// };
		// Symmetry: number;
		for (const row of tableData) {
			row.rightSummary.ROM = roundTo(row.rightSummary.ROM);
			row.rightSummary["Stride Time (s)"] = roundTo(
				row.rightSummary["Stride Time (s)"],
			);
			row.rightSummary["Swing Time (s)"] = roundTo(
				row.rightSummary["Swing Time (s)"],
			);
			row.rightSummary["Stance Time (s)"] = roundTo(
				row.rightSummary["Stance Time (s)"],
			);

			row.leftSummary.ROM = roundTo(row.leftSummary.ROM);
			row.leftSummary["Stride Time (s)"] = roundTo(
				row.leftSummary["Stride Time (s)"],
			);
			row.leftSummary["Swing Time (s)"] = roundTo(
				row.leftSummary["Swing Time (s)"],
			);
			row.leftSummary["Stance Time (s)"] = roundTo(
				row.leftSummary["Stance Time (s)"],
			);

			row.Cadence = roundTo(row.Cadence);

			row["Step Length (m)"].Left = roundTo(row["Step Length (m)"].Left);
			row["Step Length (m)"].Right = roundTo(row["Step Length (m)"].Right);
			row.Symmetry = roundTo(row.Symmetry);
		}
	};

	const tableData: TableRowType[] = [];

	const onPrintClick = async () => {
		loading = true;
		dataAvailable = false;
		const progressChunk = (1 / data.length) * 100;
		progress = 0;
		for (const sessionData of data) {
			const sessionSummary = analysisSingleSession(
				sessionData,
				0.9,
				new Date(sessionData.Date),
			);
			if (sessionSummary) {
				summary.push(sessionSummary);
				tableData.push({
					...sessionSummary,
					Date: sessionData.Date,
				});
			}
			progress += progressChunk;
		}
		formatTableData(tableData);
		tableData.sort(
			(a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime(),
		);
		chartData = makeChartData(tableData);
		progress = 100;
		dataAvailable = true;
		loading = false;
	};

	const chartConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;
</script>

<div>
	<Button onclick={onPrintClick}>Print Data</Button>
	{#if dataAvailable && !loading}
		<table
			class="border border-collapse border-gray-400 [&_td]:border [&_td]:border-gray-400 [&_td]:p-2 [&_td]:text-center"
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
				{#each tableData as row, index}
					<tr>
						<td rowspan="2">
							Session #{index + 1}
						</td>
						<td rowspan="2">
							{row.Date}
						</td>
						<td> Left </td>
						<td>
							{row.leftSummary.ROM}
						</td>
						<td>
							{row.leftSummary["Stride Time (s)"]}
						</td>
						<td>
							{row.leftSummary["Swing Time (s)"]}
						</td>
						<td>
							{row.leftSummary["Stance Time (s)"]}
						</td>
						<td rowspan="2">
							{row.Cadence}
						</td>
						<td>
							{row["Step Length (m)"].Left}
						</td>
						<td rowspan="2">
							{row.Symmetry}
						</td>
					</tr>
					<tr>
						<td> Right </td>
						<td>
							{row.rightSummary.ROM}
						</td>
						<td>
							{row.rightSummary["Stride Time (s)"]}
						</td>
						<td>
							{row.rightSummary["Swing Time (s)"]}
						</td>
						<td>
							{row.rightSummary["Stance Time (s)"]}
						</td>
						<td>
							{row["Step Length (m)"].Right}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="w-1/2">
			<Chart.Container config={chartConfig}>
				<LineChart
					data={chartData}
					x="Date"
					xScale={scaleUtc()}
					axis="x"
					series={[
						{
							key: "Cadence",
							label: "Cadence",
							color: chartConfig.desktop.color,
						},
					]}
					props={{
						spline: { curve: curveLinear, motion: "tween", strokeWidth: 2 },
						xAxis: {
							format: (v: Date) =>
								v.toLocaleDateString("en-US", { month: "short" }),
						},
						highlight: { points: { r: 4 } },
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</LineChart>
			</Chart.Container>
		</div>
	{:else if loading}
		<Progress value={progress} />
	{/if}
</div>
