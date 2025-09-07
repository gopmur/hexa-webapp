export type GaitData = {
	Date: string;
	callback_time: number[];
	SMCmr_pos: number[];
	SMCmr_vel: number[];
	SMCml_pos: number[];
	SMCml_vel: number[];
};

export type LegSummaryType = {
	rom: number;
	strideTime: number;
	swingTime: number;
	stanceTime: number;
};

export type SummaryType = {
	date: Date;
	rightLegSummary: LegSummaryType;
	leftLegSummary: LegSummaryType;
	cadence: number;
	leftStepLength: number;
	rightStepLength: number;
	symmetry: number;
};

export type ChartDataType = {
	rightRom: number;
	rightStrideTime: number;
	rightSwingTime: number;
	rightStanceTime: number;
	rightStepLength: number;
	leftRom: number;
	leftStrideTime: number;
	leftSwingTime: number;
	leftStanceTime: number;
	leftStepLength: number;
	cadence: number;
	symmetry: number;
	date: Date;
};
