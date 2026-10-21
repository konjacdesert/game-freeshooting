import { CELL, HEIGHT, PAD_FLAG, WIDTH } from "./constants.js";
import {
    ADR_CELL_SEEK,
    ADR_INPUT,
    ADR_MASK_HEAD,
    ADR_SPRITE_HEAD,
    ADR_SPRITE_NUM,
    ADR_SPRITE_SEEK,
    ADR_PALETTE_HEAD,
    ADR_PALETTE_SEEK,
    ADR_WORK_HEAD,
} from "./memoryMap.js";

const GLYPH = {
    Empty: 0,
    Player: 1,
    PlayerHit: 2,
    InvaderA0: 3,
    InvaderA1: 4,
    InvaderB0: 5,
    InvaderB1: 6,
    InvaderC0: 7,
    InvaderC1: 8,
    PlayerShot: 9,
    EnemyShot0: 10,
    EnemyShot1: 11,
    Explosion: 12,
    Shield0Left: 13,
    Shield0Right: 14,
    Shield1Left: 15,
    Shield1Right: 16,
    Shield2Left: 17,
    Shield2Right: 18,
    Star0: 19,
    Star1: 20,
    Ground: 21,
    UFOLeft: 22,
    UFORight: 23,
    FontStart: 32,
};

/** @type {[number, number[]][]} */
const GAME_GLYPHS = [
    [GLYPH.Empty, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [GLYPH.Player, [0x00, 0x18, 0x18, 0x7e, 0xff, 0xff, 0x66, 0x24]],
    [GLYPH.PlayerHit, [0x81, 0x24, 0x18, 0x5a, 0x3c, 0x18, 0x24, 0x81]],
    [GLYPH.InvaderA0, [0x5a, 0x3c, 0x7e, 0xdb, 0xff, 0x24, 0x5a, 0xa5]],
    [GLYPH.InvaderA1, [0x5a, 0x3c, 0x7e, 0xdb, 0xff, 0x5a, 0x24, 0x42]],
    [GLYPH.InvaderB0, [0x24, 0x18, 0x7e, 0xdb, 0xff, 0x5a, 0x81, 0x42]],
    [GLYPH.InvaderB1, [0x24, 0x18, 0x7e, 0xdb, 0xff, 0x24, 0x42, 0x81]],
    [GLYPH.InvaderC0, [0x42, 0xa5, 0x7e, 0xdb, 0xff, 0x18, 0x24, 0x42]],
    [GLYPH.InvaderC1, [0x42, 0xa5, 0x7e, 0xdb, 0xff, 0x18, 0x42, 0x24]],
    [GLYPH.PlayerShot, [0x00, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00]],
    [GLYPH.EnemyShot0, [0x00, 0x20, 0x10, 0x20, 0x10, 0x20, 0x10, 0x00]],
    [GLYPH.EnemyShot1, [0x00, 0x10, 0x20, 0x10, 0x20, 0x10, 0x20, 0x00]],
    [GLYPH.Explosion, [0x81, 0x24, 0x5a, 0x18, 0x5a, 0x24, 0x81, 0x00]],
    [GLYPH.Shield0Left, [0x1f, 0x7f, 0xff, 0xff, 0xff, 0xff, 0xfc, 0xf8]],
    [GLYPH.Shield0Right, [0xf8, 0xfe, 0xff, 0xff, 0xff, 0xff, 0x3f, 0x1f]],
    [GLYPH.Shield1Left, [0x1f, 0x7d, 0xef, 0xff, 0xb7, 0xfd, 0xd8, 0xf8]],
    [GLYPH.Shield1Right, [0xf8, 0xbe, 0xf7, 0xff, 0xed, 0xbf, 0x1b, 0x1f]],
    [GLYPH.Shield2Left, [0x0a, 0x54, 0xa9, 0x5b, 0xa4, 0xd1, 0x90, 0x40]],
    [GLYPH.Shield2Right, [0x50, 0x2a, 0x95, 0xda, 0x25, 0x8b, 0x09, 0x02]],
    [GLYPH.Star0, [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [GLYPH.Star1, [0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [GLYPH.Ground, [0xff, 0x55, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    [GLYPH.UFOLeft, [0x00, 0x06, 0x3f, 0x7f, 0xff, 0x3f, 0x0f, 0x00]],
    [GLYPH.UFORight, [0x00, 0x60, 0xfc, 0xfe, 0xff, 0xfc, 0xf0, 0x00]],
];

const FONT_CHARACTERS = "0123456789ACDEGILMNOPRSTUVWXY";
const FONT_GLYPHS = [
    [0x70, 0x88, 0x98, 0xa8, 0xc8, 0x88, 0x70, 0x00],
    [0x20, 0x60, 0x20, 0x20, 0x20, 0x20, 0x70, 0x00],
    [0x70, 0x88, 0x08, 0x10, 0x20, 0x40, 0xf8, 0x00],
    [0xf0, 0x08, 0x08, 0x70, 0x08, 0x08, 0xf0, 0x00],
    [0x10, 0x30, 0x50, 0x90, 0xf8, 0x10, 0x10, 0x00],
    [0xf8, 0x80, 0x80, 0xf0, 0x08, 0x08, 0xf0, 0x00],
    [0x30, 0x40, 0x80, 0xf0, 0x88, 0x88, 0x70, 0x00],
    [0xf8, 0x08, 0x10, 0x20, 0x40, 0x40, 0x40, 0x00],
    [0x70, 0x88, 0x88, 0x70, 0x88, 0x88, 0x70, 0x00],
    [0x70, 0x88, 0x88, 0x78, 0x08, 0x10, 0x60, 0x00],
    [0x70, 0x88, 0x88, 0xf8, 0x88, 0x88, 0x88, 0x00],
    [0x78, 0x80, 0x80, 0x80, 0x80, 0x80, 0x78, 0x00],
    [0xf0, 0x88, 0x88, 0x88, 0x88, 0x88, 0xf0, 0x00],
    [0xf8, 0x80, 0x80, 0xf0, 0x80, 0x80, 0xf8, 0x00],
    [0x78, 0x80, 0x80, 0xb8, 0x88, 0x88, 0x70, 0x00],
    [0x70, 0x20, 0x20, 0x20, 0x20, 0x20, 0x70, 0x00],
    [0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0xf8, 0x00],
    [0x88, 0xd8, 0xa8, 0xa8, 0x88, 0x88, 0x88, 0x00],
    [0x88, 0xc8, 0xa8, 0x98, 0x88, 0x88, 0x88, 0x00],
    [0x70, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70, 0x00],
    [0xf0, 0x88, 0x88, 0xf0, 0x80, 0x80, 0x80, 0x00],
    [0xf0, 0x88, 0x88, 0xf0, 0xa0, 0x90, 0x88, 0x00],
    [0x78, 0x80, 0x80, 0x70, 0x08, 0x08, 0xf0, 0x00],
    [0xf8, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x00],
    [0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70, 0x00],
    [0x88, 0x88, 0x88, 0x88, 0x88, 0x50, 0x20, 0x00],
    [0x88, 0x88, 0x88, 0xa8, 0xa8, 0xd8, 0x88, 0x00],
    [0x88, 0x88, 0x50, 0x20, 0x50, 0x88, 0x88, 0x00],
    [0x88, 0x88, 0x50, 0x20, 0x20, 0x20, 0x20, 0x00],
];

const PALETTE = {
    White: 0,
    Cyan: 1,
    Green: 2,
    Pink: 3,
    Yellow: 4,
    Red: 5,
    Blue: 6,
    Dim: 7,
};

const SPRITE = {
    Player: 0,
    PlayerShot: 1,
    EnemyShotFirst: 2,
    Explosion: 6,
    UFO: 7,
    EnemyFirst: 8,
    ShieldFirst: 48,
    Ground: 52,
    Score: 53,
    Lives: 54,
    Message: 55,
    Prompt: 56,
    StarFirst: 64,
};

const STATE = {
    Title: "title",
    Playing: "playing",
    Hit: "hit",
    GameOver: "gameover",
    Win: "win",
};

const ENEMY_ROWS = 5;
const ENEMY_COLUMNS = 8;
const ENEMY_COUNT = ENEMY_ROWS * ENEMY_COLUMNS;
const ENEMY_COLUMN_GAP = 20;
const ENEMY_ROW_GAP = 16;
const PLAYER_Y = 252;
const SHIELD_Y = 224;
const SHIELD_X = [28, 80, 132, 184];
const SHIELD_INITIAL_DURABILITY = 3;
const UFO_Y = 24;
const UFO_FREEZE_FRAMES = 180;
const AUTO_ADVANCE_FRAMES = 240;

const TABLE_SCORE = ADR_WORK_HEAD + 0x10;
const TABLE_LIVES = ADR_WORK_HEAD + 0x20;
const TABLE_MESSAGE = ADR_WORK_HEAD + 0x30;
const TABLE_PROMPT = ADR_WORK_HEAD + 0x40;
const TABLE_GROUND = ADR_WORK_HEAD + 0x60;
const TABLE_UFO = TABLE_GROUND + WIDTH / CELL + 4;

const STAR_POSITIONS = [
    [13, 31], [41, 46], [68, 25], [101, 39], [135, 23], [171, 42], [205, 29],
    [21, 91], [55, 113], [92, 78], [123, 105], [157, 86], [198, 119],
    [9, 151], [45, 177], [76, 145], [112, 187], [148, 156], [180, 181], [214, 148],
    [18, 208], [62, 202], [118, 211], [168, 199], [207, 216],
];

export const VCartridge = () => {
    let initialized = false;
    let previousInputs = 0;
    let frame = 0;
    let gameState = STATE.Title;
    let score = 0;
    let lives = 3;
    let playerX = (WIDTH - CELL) / 2;
    let formationX = 28;
    let formationY = 52;
    let formationDirection = 1;
    let enemyFlip = false;
    let formationTimer = 0;
    let enemyFireTimer = 60;
    let fireCooldown = 0;
    let hitTimer = 0;
    let ufoTimer = 0;
    let enemyFreezeTimer = 0;
    let autoAdvanceTimer = 0;

    /** @type {{row:number, column:number, alive:boolean}[]} */
    let enemies = [];
    const shields = SHIELD_X.map(() => SHIELD_INITIAL_DURABILITY);
    const playerShot = { active: false, x: 0, y: 0 };
    const enemyShots = Array.from({ length: 4 }, () => ({ active: false, x: 0, y: 0 }));
    const enemyExplosion = { active: false, x: 0, y: 0, timer: 0 };
    const ufo = { active: false, x: 0, direction: 1 };

    /**
     * @param {DataView} mem
     * @param {number} cellIndex
     * @param {number[]} rows
     */
    function writeGlyph(mem, cellIndex, rows) {
        const cellAddress = cellIndex * ADR_CELL_SEEK;
        for (let row = 0; row < 8; row++) {
            for (let column = 0; column < 8; column += 2) {
                const left = (rows[row] & (0x80 >> column)) !== 0 ? 0xf : 0;
                const right = (rows[row] & (0x80 >> (column + 1))) !== 0 ? 0xf : 0;
                mem.setUint8(cellAddress + row * 4 + column / 2, (left << 4) | right);
            }
        }
    }

    /**
     * @param {DataView} mem
     * @param {number} index
     * @param {number} cell
     * @param {number} x
     * @param {number} y
     * @param {number} palette
     * @param {boolean} [visible]
     * @param {number} [width]
     * @param {number} [height]
     */
    function putSprite(mem, index, cell, x, y, palette, visible = true, width = 1, height = 1) {
        const address = ADR_SPRITE_HEAD + index * ADR_SPRITE_SEEK;
        mem.setUint8(address, visible ? 0b0000_00_01 : 0);
        mem.setUint8(address + 1, palette & 0xf);
        mem.setInt16(address + 2, Math.round(x));
        mem.setInt16(address + 4, Math.round(y));
        mem.setUint8(address + 6, width);
        mem.setUint8(address + 7, height);
        mem.setUint8(address + 8, cell);
        mem.setUint8(address + 9, 0);
    }

    /**
     * @param {DataView} mem
     * @param {number} index
     * @param {number} tableAddress
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} palette
     * @param {boolean} [visible]
     */
    function putTableSprite(mem, index, tableAddress, x, y, width, palette, visible = true) {
        const address = ADR_SPRITE_HEAD + index * ADR_SPRITE_SEEK;
        mem.setUint8(address, visible ? 0b0000_00_10 : 0);
        mem.setUint8(address + 1, palette & 0xf);
        mem.setInt16(address + 2, Math.round(x));
        mem.setInt16(address + 4, Math.round(y));
        mem.setUint8(address + 6, width);
        mem.setUint8(address + 7, 1);
        mem.setUint16(address + 8, tableAddress);
    }

    /** @param {string} character */
    function fontCell(character) {
        if (character === " ") return GLYPH.Empty;
        const index = FONT_CHARACTERS.indexOf(character);
        return index < 0 ? GLYPH.Empty : GLYPH.FontStart + index;
    }

    /**
     * @param {DataView} mem
     * @param {number} spriteIndex
     * @param {number} tableAddress
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {number} palette
     */
    function putText(mem, spriteIndex, tableAddress, text, x, y, palette) {
        if (text.length === 0) {
            putTableSprite(mem, spriteIndex, tableAddress, 0, 0, 0, palette, false);
            return;
        }
        for (let index = 0; index < text.length; index++) {
            mem.setUint8(tableAddress + index, fontCell(text[index]));
        }
        putTableSprite(mem, spriteIndex, tableAddress, x, y, text.length, palette);
    }

    /** @param {string} text */
    function centeredX(text) {
        return Math.floor((WIDTH - text.length * CELL) / 2);
    }

    /** @param {DataView} mem */
    function initialize(mem) {
        for (let spriteIndex = 0; spriteIndex < ADR_SPRITE_NUM; spriteIndex++) {
            mem.setUint8(ADR_SPRITE_HEAD + spriteIndex * ADR_SPRITE_SEEK, 0);
        }

        const colors = [
            [31, 31, 31],
            [7, 29, 31],
            [13, 31, 12],
            [31, 9, 20],
            [31, 26, 6],
            [31, 5, 5],
            [8, 16, 31],
            [10, 14, 18],
        ];
        for (let paletteIndex = 0; paletteIndex < 256; paletteIndex++) {
            mem.setUint16(ADR_PALETTE_HEAD + paletteIndex * ADR_PALETTE_SEEK, 0);
        }
        for (let bank = 0; bank < colors.length; bank++) {
            const [red, green, blue] = colors[bank];
            const color = (red << 10) | (green << 5) | blue;
            mem.setUint16(ADR_PALETTE_HEAD + (bank * 16 + 0xf) * ADR_PALETTE_SEEK, color);
        }

        for (const [cellIndex, rows] of GAME_GLYPHS) {
            writeGlyph(mem, cellIndex, rows);
        }
        for (let index = 0; index < FONT_GLYPHS.length; index++) {
            writeGlyph(mem, GLYPH.FontStart + index, FONT_GLYPHS[index]);
        }

        mem.setUint8(ADR_MASK_HEAD, 0);
        mem.setUint8(ADR_MASK_HEAD + 1, 0);
        mem.setUint8(ADR_MASK_HEAD + 2, WIDTH / CELL);
        mem.setUint8(ADR_MASK_HEAD + 3, HEIGHT / CELL);
        for (let index = 0; index < WIDTH / CELL; index++) {
            mem.setUint8(TABLE_GROUND + index, GLYPH.Ground);
        }
        mem.setUint8(TABLE_UFO, GLYPH.UFOLeft);
        mem.setUint8(TABLE_UFO + 1, GLYPH.UFORight);

        resetWorld();
        gameState = STATE.Title;
        initialized = true;
    }

    function nextUfoDelay() {
        return 600 + Math.floor(Math.random() * 361);
    }

    function resetWorld(resetScore = true, resetLives = true) {
        frame = 0;
        if (resetScore) {
            score = 0;
        }
        if (resetLives) {
            lives = 3;
        }
        playerX = (WIDTH - CELL) / 2;
        formationX = 28;
        formationY = 52;
        formationDirection = 1;
        enemyFlip = false;
        formationTimer = 0;
        enemyFireTimer = 60;
        fireCooldown = 0;
        hitTimer = 0;
        ufoTimer = nextUfoDelay();
        enemyFreezeTimer = 0;
        autoAdvanceTimer = 0;
        ufo.active = false;
        ufo.x = 0;
        ufo.direction = 1;
        enemies = [];
        for (let row = 0; row < ENEMY_ROWS; row++) {
            for (let column = 0; column < ENEMY_COLUMNS; column++) {
                enemies.push({ row: row, column: column, alive: true });
            }
        }
        shields.fill(SHIELD_INITIAL_DURABILITY);
        playerShot.active = false;
        for (const shot of enemyShots) shot.active = false;
        enemyExplosion.active = false;
    }

    function startGame(preserveProgress = false) {
        resetWorld(preserveProgress, preserveProgress);
        gameState = STATE.Playing;
    }

    function enterGameOver() {
        gameState = STATE.GameOver;
        autoAdvanceTimer = 0;
        playerShot.active = false;
        for (const shot of enemyShots) shot.active = false;
    }

    /** @param {{row:number, column:number}} enemy */
    function enemyPosition(enemy) {
        return {
            x: formationX + enemy.column * ENEMY_COLUMN_GAP,
            y: formationY + enemy.row * ENEMY_ROW_GAP,
        };
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    function damageShieldAt(x, y) {
        for (let index = 0; index < shields.length; index++) {
            if (shields[index] <= 0) continue;
            if (x >= SHIELD_X[index] && x < SHIELD_X[index] + CELL * 2 &&
                y >= SHIELD_Y && y < SHIELD_Y + CELL) {
                shields[index]--;
                return true;
            }
        }
        return false;
    }

    function updateUfo() {
        if (enemyFreezeTimer > 0) {
            enemyFreezeTimer--;
            return;
        }
        if (!ufo.active) {
            ufoTimer--;
            if (ufoTimer > 0) return;
            ufo.active = true;
            ufo.direction = Math.random() < 0.5 ? 1 : -1;
            ufo.x = ufo.direction === 1 ? -CELL * 2 : WIDTH;
            return;
        }

        ufo.x += ufo.direction;
        if (ufo.x < -CELL * 2 || ufo.x > WIDTH) {
            ufo.active = false;
            ufoTimer = nextUfoDelay();
        }
    }

    function updatePlayerShot() {
        if (!playerShot.active) return;
        playerShot.y -= 4;
        const shotX = playerShot.x + 3;
        const shotY = playerShot.y + 2;

        if (playerShot.y < -CELL) {
            playerShot.active = false;
            return;
        }
        if (ufo.active && shotX >= ufo.x && shotX < ufo.x + CELL * 2 &&
            playerShot.y < UFO_Y + CELL && playerShot.y + 6 >= UFO_Y) {
            ufo.active = false;
            ufoTimer = nextUfoDelay();
            enemyFreezeTimer = UFO_FREEZE_FRAMES;
            playerShot.active = false;
            score += 100;
            enemyExplosion.active = true;
            enemyExplosion.x = ufo.x + CELL / 2;
            enemyExplosion.y = UFO_Y;
            enemyExplosion.timer = 14;
            return;
        }
        if (damageShieldAt(shotX, shotY)) {
            playerShot.active = false;
            return;
        }

        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const position = enemyPosition(enemy);
            if (shotX >= position.x && shotX < position.x + CELL &&
                playerShot.y < position.y + CELL && playerShot.y + 6 >= position.y) {
                enemy.alive = false;
                playerShot.active = false;
                score += [40, 30, 20, 20, 10][enemy.row];
                enemyExplosion.active = true;
                enemyExplosion.x = position.x;
                enemyExplosion.y = position.y;
                enemyExplosion.timer = 14;
                if (!enemies.some(candidate => candidate.alive)) {
                    gameState = STATE.Win;
                    autoAdvanceTimer = 0;
                    for (const shot of enemyShots) shot.active = false;
                }
                return;
            }
        }
    }

    function hitPlayer() {
        if (gameState !== STATE.Playing) return;
        lives--;
        hitTimer = 70;
        gameState = STATE.Hit;
        playerShot.active = false;
        for (const shot of enemyShots) shot.active = false;
    }

    function updateEnemyShots() {
        for (const shot of enemyShots) {
            if (!shot.active) continue;
            shot.y += 2;
            const shotX = shot.x + 3;
            const shotY = shot.y + 5;
            if (damageShieldAt(shotX, shotY)) {
                shot.active = false;
                continue;
            }
            if (shotX >= playerX && shotX < playerX + CELL &&
                shot.y < PLAYER_Y + CELL && shot.y + CELL >= PLAYER_Y) {
                shot.active = false;
                hitPlayer();
                return;
            }
            if (shot.y >= HEIGHT) shot.active = false;
        }
    }

    function updateEnemyFormation() {
        const alive = enemies.filter(enemy => enemy.alive);
        if (alive.length === 0) return;

        if (formationTimer > 0) {
            formationTimer--;
            return;
        } else {
            formationTimer = alive.length;
        }

        const minimumColumn = Math.min(...alive.map(enemy => enemy.column));
        const maximumColumn = Math.max(...alive.map(enemy => enemy.column));
        const speed = 2 + ((ENEMY_COUNT - alive.length) / ENEMY_COUNT) * 4;
        const nextX = formationX + formationDirection * speed;
        const nextLeft = nextX + minimumColumn * ENEMY_COLUMN_GAP;
        const nextRight = nextX + maximumColumn * ENEMY_COLUMN_GAP + CELL;

        if (nextLeft < CELL || nextRight > WIDTH - CELL) {
            formationDirection *= -1;
            formationY += CELL;
        } else {
            formationX = nextX;
        }
        enemyFlip = !enemyFlip;

        const lowestEnemyY = Math.max(...alive.map(enemy => enemyPosition(enemy).y));
        if (lowestEnemyY + CELL >= SHIELD_Y) {
            shields.fill(0);
        }
        if (lowestEnemyY + CELL >= PLAYER_Y) {
            lives = 0;
            enterGameOver();
        }
    }

    function fireEnemyShot() {
        enemyFireTimer--;
        if (enemyFireTimer > 0) return;

        const availableShot = enemyShots.find(shot => !shot.active);
        const shooters = [];
        for (let column = 0; column < ENEMY_COLUMNS; column++) {
            for (let row = ENEMY_ROWS - 1; row >= 0; row--) {
                const enemy = enemies[row * ENEMY_COLUMNS + column];
                if (enemy.alive) {
                    shooters.push(enemy);
                    break;
                }
            }
        }
        if (availableShot && shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            const position = enemyPosition(shooter);
            availableShot.active = true;
            availableShot.x = position.x;
            availableShot.y = position.y + CELL;
        }

        const destroyed = ENEMY_COUNT - enemies.filter(enemy => enemy.alive).length;
        enemyFireTimer = Math.max(28, 85 - destroyed) + Math.floor(Math.random() * 35);
    }

    /** @param {number} inputs */
    function updatePlaying(inputs) {
        let movement = 0;
        if (inputs & PAD_FLAG.Left) movement--;
        if (inputs & PAD_FLAG.Right) movement++;
        playerX = Math.max(CELL, Math.min(WIDTH - CELL * 2, playerX + movement * 2));

        if (fireCooldown > 0) fireCooldown--;
        if ((inputs & (PAD_FLAG.Z | PAD_FLAG.X)) && !playerShot.active && fireCooldown === 0) {
            playerShot.active = true;
            playerShot.x = playerX;
            playerShot.y = PLAYER_Y - CELL;
            fireCooldown = 10;
        }

        updateUfo();
        updatePlayerShot();
        if (enemyFreezeTimer <= 0) {
            updateEnemyFormation();
        } else if (enemyFreezeTimer % 6 === 0) {
            enemyFlip = !enemyFlip;
        }
        updateEnemyShots();
        if (enemyFreezeTimer <= 0) fireEnemyShot();
    }

    function updateHit() {
        hitTimer--;
        if (hitTimer > 0) return;
        if (lives <= 0) {
            enterGameOver();
            return;
        }
        playerX = (WIDTH - CELL) / 2;
        enemyFireTimer = 45;
        gameState = STATE.Playing;
    }

    /**
     * @param {DataView} mem
     * @param {{row:number, column:number, alive:boolean}} enemy
     * @param {number} index
     */
    function renderEnemy(mem, enemy, index) {
        if (!enemy.alive) {
            putSprite(mem, SPRITE.EnemyFirst + index, GLYPH.Empty, 0, 0, PALETTE.White, false);
            return;
        }
        let cell = enemyFlip ? GLYPH.InvaderC1 : GLYPH.InvaderC0;
        let palette = PALETTE.Green;
        if (enemy.row === 0) {
            cell = enemyFlip ? GLYPH.InvaderA1 : GLYPH.InvaderA0;
            palette = PALETTE.Pink;
        } else if (enemy.row < 3) {
            cell = enemyFlip ? GLYPH.InvaderB1 : GLYPH.InvaderB0;
            palette = PALETTE.Cyan;
        }
        const position = enemyPosition(enemy);
        putSprite(mem, SPRITE.EnemyFirst + index, cell, position.x, position.y, palette);
    }

    /** @param {DataView} mem */
    function render(mem) {
        const playerVisible = gameState !== STATE.GameOver;
        const playerCell = gameState === STATE.Hit ? GLYPH.PlayerHit : GLYPH.Player;
        const playerPalette = gameState === STATE.Hit && ((hitTimer >> 2) & 1) ? PALETTE.Red : PALETTE.Green;
        putSprite(mem, SPRITE.Player, playerCell, playerX, PLAYER_Y, playerPalette, playerVisible);
        putSprite(mem, SPRITE.PlayerShot, GLYPH.PlayerShot, playerShot.x, playerShot.y,
            PALETTE.Yellow, playerShot.active);
        putTableSprite(mem, SPRITE.UFO, TABLE_UFO, ufo.x, UFO_Y, 2, PALETTE.Yellow, ufo.active);

        for (let index = 0; index < enemyShots.length; index++) {
            const shot = enemyShots[index];
            const cell = (frame >> 2) & 1 ? GLYPH.EnemyShot1 : GLYPH.EnemyShot0;
            putSprite(mem, SPRITE.EnemyShotFirst + index, cell, shot.x, shot.y, PALETTE.Pink, shot.active);
        }
        putSprite(mem, SPRITE.Explosion, GLYPH.Explosion, enemyExplosion.x, enemyExplosion.y,
            PALETTE.Yellow, enemyExplosion.active);

        for (let index = 0; index < enemies.length; index++) {
            renderEnemy(mem, enemies[index], index);
        }
        for (let index = 0; index < shields.length; index++) {
            const durability = shields[index];
            const damage = Math.min(SHIELD_INITIAL_DURABILITY - durability, SHIELD_INITIAL_DURABILITY - 1);
            putSprite(mem, SPRITE.ShieldFirst + index, GLYPH.Shield0Left + damage * 2,
                SHIELD_X[index], SHIELD_Y, PALETTE.Green, durability > 0, 2);
        }

        putTableSprite(mem, SPRITE.Ground, TABLE_GROUND, 0, 270, WIDTH / CELL, PALETTE.Blue);
        putText(mem, SPRITE.Score, TABLE_SCORE, `SCORE ${String(score).padStart(6, "0")}`,
            CELL, CELL, PALETTE.White);
        putText(mem, SPRITE.Lives, TABLE_LIVES, `LIVES ${lives}`,
            WIDTH - CELL * 8, CELL, lives > 0 ? PALETTE.White : PALETTE.Red);

        let message = "";
        let prompt = "";
        let messagePalette = PALETTE.Yellow;
        if (gameState === STATE.Title) {
            message = "SOREPPOINVADERS";
            prompt = "PRESS START";
        } else if (gameState === STATE.GameOver) {
            message = "GAME OVER";
            messagePalette = PALETTE.Red;
        } else if (gameState === STATE.Win) {
            message = "YOU WIN";
            prompt = "TRY NEXT ROUND";
            messagePalette = PALETTE.Green;
        }
        putText(mem, SPRITE.Message, TABLE_MESSAGE, message, centeredX(message), 144, messagePalette);
        putText(mem, SPRITE.Prompt, TABLE_PROMPT, prompt, centeredX(prompt), 164, PALETTE.White);

        for (let index = 0; index < STAR_POSITIONS.length; index++) {
            const [x, y] = STAR_POSITIONS[index];
            putSprite(mem, SPRITE.StarFirst + index, index & 1 ? GLYPH.Star1 : GLYPH.Star0,
                x, y, index % 3 === 0 ? PALETTE.Blue : PALETTE.Dim);
        }
    }

    /** @param {DataView} mem */
    function update(mem) {
        if (!initialized) initialize(mem);

        const inputs = mem.getUint8(ADR_INPUT);
        const pressed = inputs & ~previousInputs;
        frame++;

        if (enemyExplosion.active) {
            enemyExplosion.timer--;
            if (enemyExplosion.timer <= 0) enemyExplosion.active = false;
        }

        const startPressed = pressed & PAD_FLAG.Start;
        if (gameState === STATE.Title) {
            if (startPressed) startGame(false);
        } else if (gameState === STATE.Win) {
            autoAdvanceTimer++;
            if (autoAdvanceTimer >= AUTO_ADVANCE_FRAMES) startGame(true);
        } else if (gameState === STATE.GameOver) {
            autoAdvanceTimer++;
            if (autoAdvanceTimer >= AUTO_ADVANCE_FRAMES) {
                resetWorld(false, true);// スコアは残す・ライフはリセット
                gameState = STATE.Title;
            }
        } else if (gameState === STATE.Playing) {
            updatePlaying(inputs);
        } else if (gameState === STATE.Hit) {
            updateHit();
        }

        render(mem);
        previousInputs = inputs;
    }

    return {
        update: update,
    };
};