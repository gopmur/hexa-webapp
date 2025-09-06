<script lang="ts">
	import { onMount } from "svelte";
	import { data } from "./data";
	import regression from "regression";

	type GaitData = {
		[key: string]: number[];
	};

	let loading = true;

	const diff = (data: number[]) => {
		if (data.length <= 1) return [];
		const diff = new Array<number>(data.length - 1);
		for (let i = 0; i < data.length - 1; i++) {
			diff[i] = Math.abs(data[i] - data[i - 1]);
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

	const detrend = (data: number[]) => {
		const dataPoints = data.map((value, index) => [
			index,
			value,
		]) as regression.DataPoint[];
		const trend = regression.linear(dataPoints);
		return data.map((value, index) => value - trend.predict(index)[1]);
	};

	const ptp = (data: number[]) => {
		if (data.length == 0) {
			throw Error("Data is empty");
		}
		const [max, min] = data.reduce(
			(accumulator, val) => [
				Math.max(accumulator[0], val),
				Math.min(accumulator[1], val),
			],
			[-Infinity, Infinity],
		);
		return max - min;
	};

	const adaptivePeakDetection = (angles: number[], samplingRate: number) => {
		const signalRange = ptp(angles);
		const minProminenceDeg = 5;
		const prominence = Math.max(minProminenceDeg, signalRange * 0.15);
		const minDistSeconds = 0.5;
		const distance = Math.floor(minDistSeconds * samplingRate);
		const maxIndices =  
	}

	const analysisSingleSession = (data: GaitData, legLength: number) => {
		let samplingRate: number;
		({ data, samplingRate } = computeCallbackTime(data));
		const time = data["callback_time"];
		const rightPosRaw = data["SMCmr_pos"];
		const leftPosRaw = data["SMCml_pos"];
		const rightPosDetrended = detrend(rightPosRaw);
		const leftPosDetrended = detrend(leftPosRaw);
	};

	onMount(() => {
		loading = true;

		loading = false;
	});
</script>

<div></div>
