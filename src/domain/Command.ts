import { DependencyManager } from "./DependencyManager.js";
import { COMMON_COMMANDS } from "./types/commonCommands.js";
import { PROTECTED_COMMANDS } from "./types/protectedCommands.js";
import { User } from "./User.js";
import {Dependency} from "./Dependency.js";

type CommandHandlerProps = {
    currentUser: User;
    dependencyManager: DependencyManager;
}

type CommandType = COMMON_COMMANDS | PROTECTED_COMMANDS;

type HandlerPayloadMap = {
    [COMMON_COMMANDS.CHANGE_CONFIGURATION_FILE]: unknown;
    [COMMON_COMMANDS.CHANGE_EXISTING_DEPENDENCY]: Dependency;
    [COMMON_COMMANDS.RESOLVE_CONFLICTS]: unknown;
    [COMMON_COMMANDS.GET_MAINTAINER]: unknown;
    [COMMON_COMMANDS.SHOW_THREE_VERSIONS]: { depName: string };
    [PROTECTED_COMMANDS.DELETE_DEPENDENCY]: { depName: string };
    [PROTECTED_COMMANDS.REPLACE_DEPENDENCY]: Dependency;
    [PROTECTED_COMMANDS.ADD_DEPENDENCY]: Dependency;
};

type HandlerProps<T extends CommandType = CommandType> = {
    type: T;
    payload: HandlerPayloadMap[T];
};

export class CommandHandler {
    dependencyManager: DependencyManager;
    currentUser: User;

    constructor({ currentUser, dependencyManager }: CommandHandlerProps) {
        this.currentUser = currentUser;
        this.dependencyManager = dependencyManager;
    }

    async handle<T extends CommandType>({ type, payload }: HandlerProps<T>) {
        const isCommonCommand = Object.values(COMMON_COMMANDS).includes(type as COMMON_COMMANDS);
        const isProtectedCommand = Object.values(PROTECTED_COMMANDS).includes(type as PROTECTED_COMMANDS);

        if (!isCommonCommand && !isProtectedCommand) {
            throw new Error('No such command exist.');
        }

        if (isProtectedCommand && this.currentUser.isPackageMaintainer) {
            // TS не может гарантировать соответствие сигнатур методов и типов — здесь это безопасно
            return await (this as any)[type](payload);
        }

        if (isCommonCommand) {
            // TS не может гарантировать соответствие сигнатур методов и типов — здесь это безопасно
            return await (this as any)[type](payload);
        }

        throw new Error('Command is protected from you!');
    }

    async deleteDependency({ depName }: { depName: string }) {
        this.dependencyManager.removeDependency(depName);
    }

    async changeConfigurationFile(payload: unknown) {
        await this.dependencyManager.updateConfigurationFile(payload);
    }

    async replaceDependency(payload: Dependency) {
        this.dependencyManager.removeDependency(payload.getName);
        this.dependencyManager.addDependency(payload);
    }

    async changeExistingDependencyHandler(payload: Dependency) {
        const secureVersions = await this.dependencyManager.getAllowedVersions(payload.getName);

        if (!secureVersions.includes(payload.getVersion)) {
            throw new Error('You are trying to install deps that beyond last three versions.');
        }

        this.dependencyManager.removeDependency(payload.getName);
        this.dependencyManager.addDependency(payload);
    }

    async addDependency(payload: Dependency) {
        this.dependencyManager.addDependency(payload);
    }

    async showThreeVersions(depName: string) {
        return await this.dependencyManager.getAllowedVersions(depName);
    }
}