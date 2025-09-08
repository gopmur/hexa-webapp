export type GaitAnalysisPageChartRecordType = Record<string, number | Date> & {
	date: Date;
};

export type GaitAnalysisPageChartSeriesType = {
	key: string;
	label: string;
	color: string;
};
