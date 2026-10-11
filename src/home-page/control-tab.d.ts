export type RunningMode =
	| "manual"
	| "automatic"
	| "semiautomatic"
	| "semi-automatic"
	| "smart";

export type ManualControlParamsLeg = {
	torque: number;
};

export type ManualControlParams = {
	left: ManualControlParamsLeg;
	right: ManualControlParamsLeg;
};

export type AutomaticControlParamsLeg = {
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

export type AutomaticControlConfigs = {
	left: { velocityThreshold: number };
	right: { velocityThreshold: number };
	angleThreshold: number;
};

export type SemiautomaticControlConfigs = {
	startAssistAngle: number;
	stopAssistAngle: number;
	epsilon: number;
};

export type SmartControlConfigs = {
	velocityThreshold: number;
};

export type ControlParams = {
	manual: ManualControlParams;
	automatic: AutomaticControlParams;
	semiautomatic: SemiautomaticControlParams;
	smart: SmartControlParams;
};

export type ControlConfigs = {
	automatic: AutomaticControlConfigs;
	semiautomatic: SemiautomaticControlConfigs;
	smart: SmartControlConfigs;
};

export type ControlStates = {
	running: boolean;
	mode: RunningMode;
	controlParams: ControlParams;
	controlConfigs: ControlConfigs;
};
