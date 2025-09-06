const _local_maxima_1d = (x: number[]) => {
	let midpoints = new Array<number>(Math.floor(x.length / 2));
	let left_edges = new Array<number>(Math.floor(x.length / 2));
	let right_edges = new Array<number>(Math.floor(x.length / 2));
	let m = 0;
	let i = 1;
	const i_max = x.length - 1;
	while (i < i_max) {
		if (x[i - 1] < x[i]) {
			let i_ahead = i + 1;
			while (i_ahead < i_max && x[i_ahead] == x[i]) {
				i_ahead++;
			}
			if (x[i_ahead] < x[i]) {
				left_edges[m] = i;
				right_edges[m] = i_ahead - 1;
				midpoints[m] = Math.floor((left_edges[m] + right_edges[m]) / 2);
				m++;
				i = i_ahead;
			}
		}
		i++;
	}
	midpoints = midpoints.slice(0, m);
	left_edges = left_edges.slice(0, m);
	right_edges = right_edges.slice(0, m);
	return [midpoints, left_edges, right_edges];
};

const filter_signal_by_sorted_index = (
	x: number[],
	sorted_indices: number[],
) => {
	if (sorted_indices.length == 0) {
		return [];
	}
	let filtered_x = new Array<number>(x.length);
	let filtered_index = 0;
	for (let i = 0; i < x.length; i++) {
		if (sorted_indices[filtered_index] == i) {
			filtered_x[filtered_index] = x[i];
			filtered_index++;
		}
	}
	return filtered_x.slice(0, filtered_index);
};

const filter_signal_by_conditions = (x: number[], keep: boolean[]) => {
	if (x.length != keep.length) {
		throw Error("size of x and keep should be the same");
	}
	return x.filter((_, index) => keep[index]);
};

const arg_sort = (x: number[]) =>
	x.map((_, index) => index).sort((a, b) => x[a] - x[b]);

const _select_by_peak_distance = (
	peaks: number[],
	priority: number[],
	distance: number,
) => {
	let peaks_size = peaks.length;
	const distance_ = Math.ceil(distance);
	const keep = new Array<boolean>(peaks_size).fill(true);
	const priority_to_position = arg_sort(priority);
	for (let i = peaks_size - 1; i >= 0; i--) {
		let j = priority_to_position[i];
		if (keep[j] == false) {
			continue;
		}
		let k = j - 1;
		while (0 <= k && peaks[j] - peaks[k] < distance_) {
			keep[k] = false;
			k--;
		}
		k = j + 1;
		while (k < peaks_size && peaks[k] - peaks[j] < distance_) {
			keep[k] = false;
			k++;
		}
	}
	return keep;
};

const sub = (a: number[], b: number[]) =>
	a.map((value, index) => value - b[index]);

const add = (a: number[], b: number) => a.map((value) => value + b);

const _peak_prominences = (x: number[], peaks: number[], wlen: number) => {
	let show_warning = false;
	const prominences = new Array<number>(peaks.length);
	const left_bases = new Array<number>(peaks.length);
	const right_bases = new Array<number>(peaks.length);
	for (let peak_nr = 0; peak_nr < peaks.length; peak_nr++) {
		const peak = peaks[peak_nr];
		let i_min = 0;
		let i_max = x.length - 1;
		if (!(i_min <= peak && peak <= i_max)) {
			throw Error("peak is not a valid index for x");
		}
		if (2 <= wlen) {
			i_min = Math.max(peak - Math.floor(wlen / 2), i_min);
			i_max = Math.min(peak + Math.floor(wlen / 2), i_max);
		}
		left_bases[peak_nr] = peak;
		let i = peak;
		let left_min = x[peak];
		while (i_min <= i && x[i] <= x[peak]) {
			if (x[i] < left_min) {
				left_min = x[i];
				left_bases[peak_nr] = i;
			}
			i--;
		}

		right_bases[peak_nr] = peak;
		i = peak;
		let right_min = x[peak];
		while (i <= i_max && x[i] <= x[peak]) {
			if (x[i] < right_min) {
				right_min = x[i];
				right_bases[peak_nr] = i;
			}
			i++;
		}
		prominences[peak_nr] = x[peak] - Math.max(left_min, right_min);
		if (prominences[peak_nr] == 0) {
			show_warning = true;
		}
	}
	if (show_warning) {
		console.warn("some peaks have a prominence of 0");
	}
	return [prominences, left_bases, right_bases];
};

const _select_by_property = (peak_properties: number[], pmin: number) => {
	return new Array<boolean>(peak_properties.length)
		.fill(true)
		.map((value, index) => pmin <= peak_properties[index]);
};

export const find_peaks = (x: number[], prominence: number, distance: number) => {
	if (distance < 1) {
		throw Error("distance must be greater or equal to 1");
	}
	let [peaks, left_edges, right_edges] = _local_maxima_1d(x);
	let keep = _select_by_peak_distance(
		peaks,
		filter_signal_by_sorted_index(x, peaks),
		distance,
	);
	peaks = filter_signal_by_conditions(peaks, keep);
	const wlen = -1;
	const [prominences, ,] = _peak_prominences(x, peaks, wlen);
	const pmin = prominence;
	keep = _select_by_property(prominences, pmin);
	peaks = filter_signal_by_conditions(peaks, keep);
	return peaks;
};
