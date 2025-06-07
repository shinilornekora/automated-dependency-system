import { spawn, ChildProcess } from 'child_process';
import { User } from "../domain/User.js";
import { SpawnOptions } from "node:child_process";
import { Readable } from "node:stream";

export class NpmService {
    private readonly userImage: User;

    constructor(userImage: User) {
        this.userImage = userImage;        
        this.initialize();
    }

    private initialize() {
        this.checkPlatform();
    }

    private checkPlatform() {
        if (!process.platform) {
            throw new Error("Cannot determine platform context");
        }
    }

    private getNpmExecutable(): string {
        return process.platform === "win32" ? "npm.cmd" : "npm";
    }

    private getDefaultSpawnOptions(): SpawnOptions {
        return {
            stdio: 'inherit'
        };
    }

    private getPipeSpawnOptions(): SpawnOptions {
        return {
            shell: true,
            stdio: "pipe"
        };
    }

    private wrapProcessExit(child: ChildProcess) {
        child.on('close', (code) => {
            this.exitProcessOnClose(code);
        });
    }

    private exitProcessOnClose(code: number | null) {
        if (typeof code === "number") {
            process.exit(code);
        } 

        process.exit(1);
    }

    run(command: string, args: string[] = []) {
        const npm = this.getNpmExecutable();
        const fullArgs = this.buildArgs(command, args);
        const child = spawn(npm, fullArgs, this.getDefaultSpawnOptions());
        this.wrapProcessExit(child);

        return child;
    }

    private buildArgs(command: string, args: string[]) {
        const mainArg = [command];

        if (Array.isArray(args) && args.length > 0) {
            return [...mainArg, ...args];
        } 
        
        if (Array.isArray(args)) {
            return mainArg;
        } 
        
        return mainArg;
    }

    async getAllowedSemverVersions(depName: string): Promise<string[]> {
        if (!depName || typeof depName !== "string" || depName.length < 1) {
            throw new Error("depName is required");
        }

        const output = await this.getRawVersionsOutput(depName);
        const parsed = this.parseVersionsJson(output);
        const filtered = this.filterSemverOnly(parsed);
        return filtered;
    }

    private getRawVersionsOutput(depName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const child = spawn(
                this.getNpmExecutable(),
                this.getNpmViewArgs(depName),
                this.getPipeSpawnOptions()
            );
            
            let stdoutData = "";
            let stderrData = "";

            if (child.stdout instanceof Readable) {
                child.stdout.on("data", (chunk) => {
                    stdoutData += chunk;
                });
            }

            if (child.stderr instanceof Readable) {
                child.stderr.on("data", (errorChunk) => {
                    stderrData += errorChunk.toString();
                    this.logErrorChunk(errorChunk);
                });
            }

            child.on("error", (err: unknown) => {
                reject(err);
            });

            child.on("close", (code: number) => {
                if (code !== 0) {
                    this.logExecError(depName, code, stderrData);
                    reject(new Error(`[user - ${this.userImage.getName}] npm view exited with code ${code})`));
                    return;
                }
                resolve(stdoutData);
            });
        });
    }

    private parseVersionsJson(jsonString: string): string[] {
        try {
            const jsonParsed = JSON.parse(jsonString);

            if (Array.isArray(jsonParsed)) {
                return jsonParsed;
            }
            
            if (typeof jsonParsed === "object" && jsonParsed !== null) {
                return Object.values(jsonParsed).map((v: unknown) => String(v));
            } 
            
            if (typeof jsonParsed === "string") {
                return [jsonParsed];
            } 

            return [];    
        } catch (err) {
            this.logParseError(err, jsonString);

            return [];
        }
    }

    private filterSemverOnly(versions: string[]): string[] {
        const semverRegex = /^\d+\.\d+\.\d+$/;
        if (!Array.isArray(versions) || versions.length === 0) {
            return [];
        }
        const filtered: string[] = [];

        for (let v of versions) {
            if (this.isSemverFormatted(v, semverRegex)) {
                filtered.push(v);
            }
        }

        return filtered;
    }

    private isSemverFormatted(input: string, regex: RegExp): boolean {
        return regex.test(input);
    }

    private getNpmViewArgs(depName: string): string[] {
        return ["view", depName, "versions", "--json"];
    }

    private logErrorChunk(chunk: Buffer) {
        const txt = chunk?.toString();

        if (txt && txt.length > 0) {
            process.stderr.write(txt);
        }
    }

    private logExecError(depName: string, code: number, stderrData: string) {
        let base = `[${depName}] npm view error (exit code ${code})`;
        if (stderrData && stderrData.length > 0) {
            base += `: ${stderrData}`;
        }
        process.stderr.write(base + "\n");
    }

    private logParseError(err: any, json: string) {
        let base = `[ParseError] Failed to parse versions: ${err && err.message ? err.message : err}`;
        base += `\nInput: ${json}`;
        process.stderr.write(base + "\n");
    }

    async startApp() {
        await this.preStartChecks();
        this.run('start');
        await this.postStartHook();
    }

    private async preStartChecks() {
        console.log('[ADS]: APP_STARTED');
        await Promise.resolve(true);
    }

    private async postStartHook() {
        console.log('[ADS]: APP_WAS_SUCCESSFULLY_OPENED');
        await Promise.resolve(true);
    }
}
