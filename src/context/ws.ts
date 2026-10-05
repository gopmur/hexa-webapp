import { createContext } from "svelte";

export const [getWebSocket, setWebSocket] = createContext<WebSocket>();

export type MotorStatus = {
	motorIndex: number;
	motorId?: number;
	canId?: number;
	status: string;
};

export type MotorStatusState = {
	motors: MotorStatus[];
	connectionStatus: "connecting" | "connected" | "disconnected";
};

export const [getMotorStatusState, setMotorStatusState] =
	createContext<MotorStatusState>();
