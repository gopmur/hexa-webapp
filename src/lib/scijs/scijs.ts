import regression from "regression";

const LocalMaxima1d = (x: number[]) => {
	let midpoints = new Array<number>(Math.floor(x.length / 2));
	let leftEdges = new Array<number>(Math.floor(x.length / 2));
	let rightEdges = new Array<number>(Math.floor(x.length / 2));
	let m = 0;
	let i = 1;
	const iMax = x.length - 1;
	while (i < iMax) {
		if (x[i - 1] < x[i]) {
			let iAhead = i + 1;
			while (iAhead < iMax && x[iAhead] == x[i]) {
				iAhead++;
			}
			if (x[iAhead] < x[i]) {
				leftEdges[m] = i;
				rightEdges[m] = iAhead - 1;
				midpoints[m] = Math.floor((leftEdges[m] + rightEdges[m]) / 2);
				m++;
				i = iAhead;
			}
		}
		i++;
	}
	midpoints = midpoints.slice(0, m);
	leftEdges = leftEdges.slice(0, m);
	rightEdges = rightEdges.slice(0, m);
	return [midpoints, leftEdges, rightEdges];
};

const filterSignalBySortedIndex = (x: number[], sortedIndices: number[]) => {
	if (sortedIndices.length == 0) {
		return [];
	}
	let filteredX = new Array<number>(x.length);
	let filteredIndex = 0;
	for (let i = 0; i < x.length; i++) {
		if (sortedIndices[filteredIndex] == i) {
			filteredX[filteredIndex] = x[i];
			filteredIndex++;
		}
	}
	return filteredX.slice(0, filteredIndex);
};

const filterSignalByConditions = (x: number[], keep: boolean[]) => {
	if (x.length != keep.length) {
		throw Error("size of x and keep should be the same");
	}
	return x.filter((_, index) => keep[index]);
};

const argSort = (x: number[]) =>
	x.map((_, index) => index).sort((a, b) => x[a] - x[b]);

const selectByPeakDistance = (
	peaks: number[],
	priority: number[],
	distance: number,
) => {
	let peaksSize = peaks.length;
	const distanceInt = Math.ceil(distance);
	const keep = new Array<boolean>(peaksSize).fill(true);
	const priorityToPosition = argSort(priority);
	for (let i = peaksSize - 1; i >= 0; i--) {
		let j = priorityToPosition[i];
		if (keep[j] == false) {
			continue;
		}
		let k = j - 1;
		while (0 <= k && peaks[j] - peaks[k] < distanceInt) {
			keep[k] = false;
			k--;
		}
		k = j + 1;
		while (k < peaksSize && peaks[k] - peaks[j] < distanceInt) {
			keep[k] = false;
			k++;
		}
	}
	return keep;
};

const sub = (a: number[], b: number[]) =>
	a.map((value, index) => value - b[index]);

const add = (a: number[], b: number) => a.map((value) => value + b);

const peakProminences = (x: number[], peaks: number[], wlen: number) => {
	const prominences = new Array<number>(peaks.length);
	const leftBases = new Array<number>(peaks.length);
	const rightBases = new Array<number>(peaks.length);
	for (let peakNr = 0; peakNr < peaks.length; peakNr++) {
		const peak = peaks[peakNr];
		let iMin = 0;
		let iMax = x.length - 1;
		if (!(iMin <= peak && peak <= iMax)) {
			throw Error("peak is not a valid index for x");
		}
		if (2 <= wlen) {
			iMin = Math.max(peak - Math.floor(wlen / 2), iMin);
			iMax = Math.min(peak + Math.floor(wlen / 2), iMax);
		}
		leftBases[peakNr] = peak;
		let i = peak;
		let leftMin = x[peak];
		while (iMin <= i && x[i] <= x[peak]) {
			if (x[i] < leftMin) {
				leftMin = x[i];
				leftBases[peakNr] = i;
			}
			i--;
		}

		rightBases[peakNr] = peak;
		i = peak;
		let rightMin = x[peak];
		while (i <= iMax && x[i] <= x[peak]) {
			if (x[i] < rightMin) {
				rightMin = x[i];
				rightBases[peakNr] = i;
			}
			i++;
		}
		prominences[peakNr] = x[peak] - Math.max(leftMin, rightMin);
	}
	return [prominences, leftBases, rightBases];
};

const SelectByProperty = (peakProperties: number[], pmin: number) => {
	return new Array<boolean>(peakProperties.length)
		.fill(true)
		.map((_, index) => pmin <= peakProperties[index]);
};

export const findPeaks = (
	x: number[],
	prominence: number,
	distance: number,
) => {
	if (distance < 1) {
		throw Error("distance must be greater or equal to 1");
	}
	let [peaks, ,] = LocalMaxima1d(x);
	let keep = selectByPeakDistance(
		peaks,
		filterSignalBySortedIndex(x, peaks),
		distance,
	);
	peaks = filterSignalByConditions(peaks, keep);
	const wlen = -1;
	const [prominences, ,] = peakProminences(x, peaks, wlen);
	const pmin = prominence;
	keep = SelectByProperty(prominences, pmin);
	peaks = filterSignalByConditions(peaks, keep);
	return peaks;
};

export const detrend = (data: number[]) => {
	const dataPoints = data.map((value, index) => [
		index,
		value,
	]) as regression.DataPoint[];
	const trend = regression.linear(dataPoints);
	return data.map((value, index) => value - trend.predict(index)[1]);
};

export const ptp = (data: number[]) => {
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

export const radians = (angle: number) => (angle * Math.PI) / 180;
