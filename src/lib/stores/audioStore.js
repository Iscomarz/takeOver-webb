import { writable } from 'svelte/store';

export const initialAudioState = {
	status: 'idle',
	isPlaying: false,
	isExpanded: false,
	isMuted: false,
	volume: 70,
	positionMs: 0,
	durationMs: 0,
	currentIndex: 0,
	playRequest: 0,
	errorMessage: ''
};

export const audioStore = writable({ ...initialAudioState });
