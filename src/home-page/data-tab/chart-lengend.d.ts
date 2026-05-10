type ChartSeries = {
	key: string;
	label: string;
	color: string;
};

type ChartLegendProps = {
	series: ChartSeries[];
	values?: Record<string, string> | undefined;
};
