import { spawn } from 'child_process';

export class NpmService {
    run(command: string, args: string[] = []) {
        // Block install-changing operations: if extra arguments are provided with "install" then exit.
        if (command === 'install' && args.length > 0) {
            console.error("Install-changing operations are blocked by ADS.");
            process.exit(1);
        }
        
        const npm = process.platform === "win32" ? "npm.cmd" : "npm";
        const child = spawn(npm, [command, ...args], { stdio: 'inherit' });

        child.on('close', (code) => {
            process.exit(code);
        });
    }
}