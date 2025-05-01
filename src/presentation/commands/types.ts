export type ConsoleCommand = {
    command: string;
    description: string;
    option?: string[];
    action: (cmdObj?: any, args?: Readonly<[string, string]>) => Promise<void>;
}