export const FPS = 60;
export const WIDTH = 224;
export const HEIGHT = 288;
export const CELL = 8;
export const CW = WIDTH / CELL;
export const CH = HEIGHT / CELL;

export const PAD_FLAG = {
    Left: 1 << 0,
    Right: 1 << 1,
    Up: 1 << 2,
    Down: 1 << 3,
    Z: 1 << 4,
    X: 1 << 5,
    Start: 1 << 6,
};
