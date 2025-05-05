import { spawn } from 'child_process';
import { User } from "../domain/User.js";
import { SpawnOptions } from "node:child_process";
import { Readable } from "node:stream";

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

        return child;
    }

    /**
     * Функция, получающая все корректные (semver) версии из npm.
     */
    async getAllowedSemverVersions(depName: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const child = spawn("npm", ["view", depName, "versions", "--json"], {
                shell: true,
                stdio: "pipe"
            } as SpawnOptions);

            let stdoutData = "";

            if (child.stdout instanceof Readable) {
                child.stdout.on("data", (chunk) => {
                    stdoutData += chunk;
                });
            }

            if (child.stderr instanceof Readable) {
                child.stderr.on("data", (errorChunk) => {
                    console.error(errorChunk.toString());
                });
            }

            child.on("close", (code) => {
                if (code !== 0) {
                    return reject(new Error(`npm view exited with code ${code})`));
                }
                try {
                    const versions: string[] = JSON.parse(stdoutData);
                    const semverRegex = /^\d+\.\d+\.\d+$/;
                    const filtered = versions.filter((v) => semverRegex.test(v));
                    resolve(filtered);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    // Только сюда можно было отнести эту команду.
    // Не нужен же еще отдельно ProjectStateManager.
    async startApp() {
        this.run('start');
    }
}