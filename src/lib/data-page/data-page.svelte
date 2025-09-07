<script lang="ts">
	import { onMount } from "svelte";
	import { data } from "./data";
	import { detrend, findPeaks, ptp, radians } from "$lib/scijs/scijs";

	type GaitData = {
		[key: string]: number[];
	};

	let loading = true;

	const diff = (data: number[]) => {
		if (data.length <= 1) return [];
		const diff = new Array<number>(data.length - 1);
		for (let i = 0; i < data.length - 1; i++) {
			diff[i] = data[i + 1] - data[i]; // correct forward diff
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
			return [null, null, null];
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

	onMount(() => {
		loading = true;
		const sessionSummary = analysisSingleSession(
			data,
			0.9,
			new Date(Date.now()),
		);
		console.log(sessionSummary)
		loading = false;
	});
</script>

<div></div>
