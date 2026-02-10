export const ADR_CELL_SEEK = 32;
// アドレス0x0000からbank*0x2000+indexで指定
// indexは0x00-0xffまで範囲を取れる
// bankは0x0-0xfまで範囲を取れるが、実際はその他の管理領域に突っ込むため0-6までしか使えない

export const MEM_ALL_MAX = 0x10000;
export const ADR_FIXED_HEAD = 0xF800;

export const ADR_PALETTE_HEAD = ADR_FIXED_HEAD;
export const ADR_PALETTE_SEEK = 2;
export const ADR_PALETTE_NUM = 256;

export const ADR_MASK_HEAD = ADR_PALETTE_HEAD + ADR_PALETTE_SEEK * ADR_PALETTE_NUM;
export const ADR_MASK_SEEK = 4;
export const ADR_MASK_NUM = 4;

export const ADR_SPRITE_HEAD = ADR_MASK_HEAD + ADR_MASK_SEEK * ADR_MASK_NUM;
export const ADR_SPRITE_SEEK = 10;
export const ADR_SPRITE_NUM = 128;

export const ADR_WORK_HEAD = ADR_SPRITE_HEAD + ADR_SPRITE_SEEK * ADR_SPRITE_NUM;
export const ADR_INPUT = ADR_WORK_HEAD + 0x00;
