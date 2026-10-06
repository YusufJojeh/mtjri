import { Easing, interpolate } from 'remotion';

const clamp = {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
} as const;

export const uiEase = Easing.bezier(0.16, 1, 0.3, 1);
export const editorialEase = Easing.bezier(0.45, 0, 0.55, 1);

export const progress = (
    frame: number,
    start: number,
    duration: number,
    easing: ((input: number) => number) = uiEase,
): number => {
    return interpolate(frame, [start, start + duration], [0, 1], {
        ...clamp,
        easing,
    });
};

export const fadeOut = (
    frame: number,
    start: number,
    duration: number,
    easing: ((input: number) => number) = Easing.in(Easing.cubic),
): number => {
    return interpolate(frame, [start, start + duration], [1, 0], {
        ...clamp,
        easing,
    });
};

export const mapRange = (value: number, from: number, to: number): number => {
    return interpolate(value, [0, 1], [from, to], clamp);
};

export const floatOffset = (frame: number, amplitude = 12, divisor = 40, phase = 0): number => {
    return Math.sin((frame + phase) / divisor) * amplitude;
};

export const sceneOpacity = (
    frame: number,
    durationInFrames: number,
    enterDuration = 18,
    exitDuration = 18,
): number => {
    return progress(frame, 0, enterDuration) * fadeOut(frame, Math.max(0, durationInFrames - exitDuration), exitDuration);
};
