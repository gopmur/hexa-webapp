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