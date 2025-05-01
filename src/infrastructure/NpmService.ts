import { spawn } from 'child_process';
import { User } from "../domain/User.js";

/**
 * Класс для взаимодействия с пакетным менеджером.
 * Эта обертка нужна для учтения пермиссий согласно переданным ролям.
 */
export class NpmService {
    private userImage: User;

    constructor(userImage: User) {
        this.userImage = userImage;
    }

    run(command: string, args: string[] = []) {
        const npm = process.platform === "win32" ? "npm.cmd" : "npm";
        const child = spawn(npm, [command, ...args], { stdio: 'inherit' });

        child.on('close', (code) => {
            process.exit(code);
        });
    }
}