import { createContext } from "svelte";

export const [getWebSocket, setWebSocket] = createContext<WebSocket>();
