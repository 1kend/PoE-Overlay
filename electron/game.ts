import { IpcMain, Rectangle } from 'electron';
import * as path from 'path';
import { getActiveWindow, Window } from './window';

const POE_NAMES = [
    'pathofexile_x64_kg.exe', 'pathofexile_kg.exe',
    'pathofexile_x64steam.exe', 'pathofexilesteam.exe',
    'pathofexile_x64.exe', 'pathofexile.exe',
];

const POE_TITLES = [
    'Path of Exile'
];

export class Game {
    private window: Window;

    public active?: boolean;
    public bounds?: Rectangle;

    public update(): boolean {
        const old = this.toString();

        const window = getActiveWindow();
        if (window) {
            const windowPath = (window.path || '').toLowerCase();
            const name = path.basename(windowPath);
            if (POE_NAMES.includes(name)) {
                const title = window.title();
                if (POE_TITLES.includes(title)) {
                    this.window = window;
                    this.active = true;
                    this.bounds = window.bounds();
                } else {
                    this.active = false;
                }
            } else {
                this.active = false;
            }
        } else {
            this.active = false;
        }
        return old !== this.toString();
    }

    public focus(): void {
        this.window?.bringToTop();
    }

    private toString(): string {
        return JSON.stringify({
            active: this.active,
            bounds: this.bounds,
            processId: this.window?.processId
        });
    }
}

export function register(ipcMain: IpcMain, onUpdate: (game: Game) => void): void {
    const game = new Game();

    ipcMain.on('game-focus', event => {
        console.log('focus');
        game.focus();
        event.returnValue = true;
    });

    ipcMain.on('game-send-active-change', event => {
        onUpdate(game);
        event.returnValue = true;
    });

    setInterval(() => {
        if (game.update()) {
            onUpdate(game);
        }
    }, 500);
}