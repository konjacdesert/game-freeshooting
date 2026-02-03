export const ADR_PALETTE_HEAD = 0x0000;
export const ADR_PALETTE_SEEK = 2;
export const ADR_PALETTE_NUM = 256;
export const ADR_PALETTE_SEPARATE = 16;

export const ADR_CHIP_HEAD = ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * ADR_PALETTE_NUM;
export const ADR_CHIP_SEEK = 32;
export const ADR_CHIP_NUM = 1024;

export const ADR_CELL_HEAD = ADR_CHIP_HEAD + ADR_CHIP_SEEK * ADR_CHIP_NUM;
export const ADR_CELL_SEEK = 2;
export const ADR_CELL_NUM = 4096;

export const ADR_MASK_HEAD = ADR_CELL_HEAD + ADR_CELL_SEEK * ADR_CELL_NUM;
export const ADR_MASK_SEEK = 4;
export const ADR_MASK_NUM = 4;

export const ADR_SPRITE_HEAD = ADR_MASK_HEAD + ADR_MASK_SEEK * ADR_MASK_NUM;
export const ADR_SPRITE_SEEK = 10;
export const ADR_SPRITE_NUM = 128;

export const ADR_WORK_HEAD = ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * ADR_SPRITE_NUM;
export const ADR_INPUT = ADR_WORK_HEAD + 0x00;

export const MEM_ALL_MAX = ADR_WORK_HEAD + 0x100;
