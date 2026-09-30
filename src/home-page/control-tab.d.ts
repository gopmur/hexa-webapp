export type RunningMode = "manual" | "automatic" | "semiautomatic" | "smart";

export type ManualControlParamsLeg = {
	torque: number;
};

export type ManualControlParams = {
	left: ManualControlParamsLeg;
	right: ManualControlParamsLeg;
};

export type AutomaticControlParamsLeg = {
	velocityThreshold: number;
	torque: number;
	timeout: number;
};

export type AutomaticControlParams = {
	right: AutomaticControlParamsLeg;
	left: AutomaticControlParamsLeg;
};

export type SemiautomaticControlParamsLeg = {
	torque: number;
	delay: number;
	timeout: number;
};

export type SemiautomaticControlParams = {
	weakLeg: "left" | "right";
	startAssistAngle: number;
	stopAssistAngle: number;
	left: SemiautomaticControlParamsLeg;
	right: SemiautomaticControlParamsLeg;
};

export type SmartControlParamsLeg = {
	torque: number;
};

export type SmartControlParams = {
	left: SmartControlParamsLeg;
	right: SmartControlParamsLeg;
};

export type ControlParams = {
	manual: ManualControlParams;
	automatic: AutomaticControlParams;
	semiautomatic: SemiautomaticControlParams;
	smart: SmartControlParams;
};

export type ControlStates = {
	running: boolean;
	mode: RunningMode;
	controlParams: ControlParams;
};
