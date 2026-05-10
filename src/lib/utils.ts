import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};

export const debounce = (fn: (...args: any[]) => void, delay: number) => {
	let timer: ReturnType<typeof setTimeout> | null = null;

	return (...args: any[]) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
};

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const numberIsValid = (n: number | null | undefined): n is number => {
	return n !== undefined && n !== null && !isNaN(n);
};


export const formatSize = (n: number) => {
	if (n >= 2**30) {
		return `${(n / 2**30).toFixed(1)}GB`
	}
	if (n >= 2**20) {
		return `${(n / 2**20).toFixed(1)}MB`
	}
	if (n >= 2**10) {
		return `${(n / 2**10).toFixed(1)}kB`
	}
	return `${n}B`
}