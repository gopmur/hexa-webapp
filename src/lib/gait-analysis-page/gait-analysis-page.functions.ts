import {
	arange,
	detrend,
	diff,
	findPeaks,
	mean,
	ptp,
	radians,
} from "$lib/scijs/scijs";
import type { TableRowType } from "./gait-analysis-page-table/gait-analysis-page-table.type";
import type {
	GaitData,
	LegSummaryType,
	SummaryType,
} from "./gait-analysis-page";
import type { ChartDataType } from "./gait-analysis-page-charts/gait-analysis-page-charts";

export const computeCallbackTime = (data: GaitData, samplingRate = 100) => {
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

export const adaptivePeakDetection = (
	angles: number[],
	samplingRate: number,
) => {
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

export const getResultAvg = (data: LegSummaryType[]) => {
	if (data.length == 0) {
		throw Error("data shouldn't be empty");
	}
	const meanResult: LegSummaryType = {
		rom: 0,
		strideTime: 0,
		swingTime: 0,
		stanceTime: 0,
	};
	for (const dataPoint of data) {
		meanResult.rom += dataPoint.rom;
		meanResult["stanceTime"] += dataPoint["stanceTime"];
		meanResult["swingTime"] += dataPoint["swingTime"];
		meanResult["strideTime"] += dataPoint["strideTime"];
	}
	meanResult.rom /= data.length;
	meanResult["stanceTime"] /= data.length;
	meanResult["swingTime"] /= data.length;
	meanResult["strideTime"] /= data.length;
	return meanResult;
};

export const analysisSingleSession = (
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
	const rightResultData: LegSummaryType[] = [];
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
				rom: ptp(rightPosRaw.slice(startIdx, endIdx)),
				strideTime: strideTime,
				swingTime: swingTime,
				stanceTime: stanceTime,
			});
		}
	}
	const leftResultData: LegSummaryType[] = [];
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
				rom: ptp(leftPosRaw.slice(startIdx, endIdx)),
				strideTime: strideTime,
				swingTime: swingTime,
				stanceTime: stanceTime,
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
		date: sessionDate,
		leftLegSummary: leftSummary,
		rightLegSummary: rightSummary,
		leftStepLength: legLength * radians(leftSummary.rom),
		rightStepLength: legLength * radians(rightSummary.rom),
		symmetry:
			(1 -
				Math.abs(rightSummary.rom - leftSummary.rom) /
					(0.5 * (rightSummary.rom + leftSummary.rom))) *
			100,
		cadence: totalTimeMinutes > 0 ? totalSteps / totalTimeMinutes : 0,
	};
	return summary;
};

function roundTo(num: number, decimals = 2) {
	return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export const makeTableData = (summary: SummaryType[]) => {
	const tableData: TableRowType[] = [];
	for (const row of summary) {
		tableData.push({
			cadence: row.cadence.toFixed(2),
			date: row.date.toString(),
			leftRom: row.leftLegSummary.rom.toFixed(2),
			leftStanceTime: row.leftLegSummary.stanceTime.toFixed(2),
			leftStepLength: row.leftStepLength.toFixed(2),
			leftStrideTime: row.leftLegSummary.strideTime.toFixed(2),
			leftSwingTime: row.leftLegSummary.swingTime.toFixed(2),
			rightRom: row.rightLegSummary.rom.toFixed(2),
			rightStanceTime: row.rightLegSummary.stanceTime.toFixed(2),
			rightStepLength: row.rightStepLength.toFixed(2),
			rightStrideTime: row.rightLegSummary.strideTime.toFixed(2),
			rightSwingTime: row.rightLegSummary.swingTime.toFixed(2),
			symmetry: row.symmetry.toFixed(2),
		});
	}
	tableData.sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
	return tableData;
};

export const makeChartData = (summary: SummaryType[]) => {
	const chartData: ChartDataType[] = [];
	for (const row of summary) {
		chartData.push({
			cadence: row.cadence,
			date: row.date,
			leftRom: row.leftLegSummary.rom,
			leftStanceTime: row.leftLegSummary.stanceTime,
			leftStepLength: row.leftStepLength,
			leftStrideTime: row.leftLegSummary.strideTime,
			leftSwingTime: row.leftLegSummary.swingTime,
			rightRom: row.rightLegSummary.rom,
			rightStanceTime: row.rightLegSummary.stanceTime,
			rightStepLength: row.rightStepLength,
			rightStrideTime: row.rightLegSummary.strideTime,
			rightSwingTime: row.rightLegSummary.swingTime,
			symmetry: row.symmetry,
		});
	}
	chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
	return chartData;
};

export const analyzeSessions = (data: GaitData[], legLength: number) => {
	const summary: SummaryType[] = [];
	for (const sessionData of data) {
		const sessionSummary = analysisSingleSession(
			sessionData,
			0.9,
			new Date(sessionData.Date),
		);
		if (sessionSummary) {
			summary.push(sessionSummary);
		}
	}
	return summary;
};
