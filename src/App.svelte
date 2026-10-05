<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import HomePage from "./home-page.svelte";
	import Router from "svelte-spa-router";
	import SettingsPage from "./settings-page.svelte";
	import TopBar from "./top-bar.svelte";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import { API_ADDRESS, WS_API_ADDRESS } from "./config";
	import {
		setMotorStatusState,
		setWebSocket,
		type MotorStatus,
		type MotorStatusState,
	} from "./context/ws";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	const routes = {
		"/": HomePage,
		"/settings": SettingsPage,
	};

	const ws = new WebSocket(`${WS_API_ADDRESS}/api/control/manual/torque`);
	const motorStatusState = $state<MotorStatusState>({
		motors: [],
		connectionStatus: "connecting",
	});
	setMotorStatusState(motorStatusState);

	onMount(() => {
		setWebSocket(ws);
		let disposed = false;
		let motorStatusSocket: WebSocket | undefined;
		let statusEventSequence = 0;
		let initialSnapshotLoaded = false;
		const latestEventByIndex = new Map<number, number>();

		const notifyStatusChange = (previous: MotorStatus | undefined, next: MotorStatus) => {
			if (!initialSnapshotLoaded || !previous || previous.status === next.status) return;
			const message = `Motor ${next.motorIndex + 1} status changed to ${next.status}`;
			if (next.status === "ok") toast.success(message);
			else toast.error(message);
		};

		const pollMotorStatuses = async () => {
			const requestSequence = statusEventSequence;
			try {
				const response = await fetch(`${API_ADDRESS}/api/motor/status`);
				if (!response.ok) throw new Error(`Motor status request failed: ${response.status}`);
				const payload: unknown = await response.json();
				if (!Array.isArray(payload)) throw new Error("Invalid motor status response");

				const previousStatuses = new Map(
					motorStatusState.motors.map((motor) => [motor.motorIndex, motor]),
				);
				const statuses = new Map<number, MotorStatus>();
				payload.forEach((item: unknown, motorIndex: number) => {
					if (motorIndex >= 8) return;
					if (typeof item !== "object" || item === null || !("status" in item)) return;
					const statusItem = item as { canId?: unknown; status: unknown };
					if (typeof statusItem.status !== "string") return;
					statuses.set(motorIndex, {
						motorIndex,
						canId: typeof statusItem.canId === "number" ? statusItem.canId : undefined,
						status: statusItem.status,
					});
				});
				for (const [motorIndex, eventSequence] of latestEventByIndex) {
					if (eventSequence > requestSequence) {
						const eventStatus = motorStatusState.motors.find(
							(motor) => motor.motorIndex === motorIndex,
						);
						if (eventStatus) {
							const polledStatus = statuses.get(motorIndex);
						statuses.set(motorIndex, {
							...eventStatus,
							canId: eventStatus.canId ?? polledStatus?.canId,
						});
						}
					}
				}
				for (const status of statuses.values()) {
					notifyStatusChange(previousStatuses.get(status.motorIndex), status);
				}
				initialSnapshotLoaded = true;
				motorStatusState.motors = [...statuses.values()].sort(
					(left, right) => left.motorIndex - right.motorIndex,
				);
			} catch (error) {
				console.error("Failed to poll motor statuses", error);
			}
		};

		const connectMotorStatusStream = async () => {
			await pollMotorStatuses();
			if (disposed) return;
			motorStatusSocket = new WebSocket(`${WS_API_ADDRESS}/api/motor/notification/status`);
			motorStatusSocket.onopen = () => {
				motorStatusState.connectionStatus = "connected";
				void pollMotorStatuses();
			};
			motorStatusSocket.onmessage = (event) => {
				try {
					const payload = JSON.parse(String(event.data)) as {
						motorId?: unknown;
						motorIndex?: unknown;
						status?: unknown;
					};
					if (typeof payload.status !== "string") return;
					const motorIndex = typeof payload.motorIndex === "number"
						? payload.motorIndex
						: motorStatusState.motors.find((motor) => motor.canId === payload.motorId)
								?.motorIndex;
					if (motorIndex === undefined || motorIndex < 0 || motorIndex >= 8) return;
					latestEventByIndex.set(motorIndex, ++statusEventSequence);
					const currentStatus = motorStatusState.motors.find(
						(motor) => motor.motorIndex === motorIndex,
					);
					const nextStatus: MotorStatus = {
						motorIndex,
						motorId: typeof payload.motorId === "number" ? payload.motorId : undefined,
						canId: currentStatus?.canId,
						status: payload.status,
					};
					notifyStatusChange(currentStatus, nextStatus);
					motorStatusState.motors = [
						...motorStatusState.motors.filter((motor) => motor.motorIndex !== motorIndex),
						nextStatus,
					].sort((left, right) => left.motorIndex - right.motorIndex);
				} catch (error) {
					console.error("Invalid motor status notification", error);
				}
			};
			motorStatusSocket.onerror = () => {
				motorStatusState.connectionStatus = "disconnected";
			};
			motorStatusSocket.onclose = () => {
				motorStatusState.connectionStatus = "disconnected";
			};
		};

		void connectMotorStatusStream();
		return () => {
			disposed = true;
			motorStatusSocket?.close();
		};
	});
</script>

<main class="h-dvh w-full overflow-hidden">
	<Toaster position="top-center" richColors={true} closeButton={true} />
	<ModeWatcher />
	<div class="h-full w-screen flex flex-col overflow-hidden">
		<TopBar />
		<div class="flex flex-col flex-1 overflow-hidden">
			<Router {routes} />
		</div>
	</div>
</main>
