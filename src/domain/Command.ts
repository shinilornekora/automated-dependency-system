import { DependencyManager } from "./DependencyManager";
import { COMMON_COMMANDS } from "./types/commonCommands";
import { PROTECTED_COMMANDS } from "./types/protectedCommands";
import { User } from "./User";
import {Dependency} from "./Dependency";

type CommandHandlerProps = {
    currentUser: User;
    dependencyManager: DependencyManager;
}

type HandlerProps = {
    type: PROTECTED_COMMANDS & COMMON_COMMANDS;
    payload: Record<string, Dependency>;
}

// Обработчик команд (верхнеуровневый)
// Идет в менеджер для осуществления реальных комманд
// Нужен чтобы распределять команды по разрешениям
export class CommandHandler {
    dependencyManager: DependencyManager;
    currentUser: User;

    constructor({ currentUser, dependencyManager}: CommandHandlerProps) {
        this.currentUser = currentUser;
        this.dependencyManager = dependencyManager;
    }

    handle({ type, payload }: HandlerProps) {
        const isCommonCommand = COMMON_COMMANDS[type]
        const isProtectedCommand = PROTECTED_COMMANDS[type];

        if (!isCommonCommand && !isProtectedCommand) {
            throw new Error('No such command exist.')
        }

        if (isProtectedCommand && this.currentUser.isPackageMaintainer) {
            // @ts-expect-error: сложные типы
            return this[PROTECTED_COMMANDS[type]](payload);
        }

        if (isCommonCommand) {
            // @ts-expect-error: сложные типы
            return this[COMMON_COMMANDS[type]](payload);
        }

        throw new Error('Command is protected from you!')
    }

    async deleteDependency({ depName }: { depName: string }) {
        this.dependencyManager.removeDependency(depName)
    }

    async changeConfigurationFile(payload: unknown) {
        await this.dependencyManager.updateConfigurationFile(payload);
    }

    async replaceDependency(payload: Dependency) {
        this.dependencyManager.removeDependency(payload.getName);
        this.dependencyManager.addDependency(payload)
    }

    async changeExistingDependencyHandler(payload: Dependency) {
        const secureVersions = await this.dependencyManager.getAllowedVersions(payload.getName);

        if (!secureVersions.includes(payload.getVersion)) {
            throw new Error('You are trying to install deps that beyond last three versions.')
        }

        this.dependencyManager.removeDependency(payload.getName);
        this.dependencyManager.addDependency(payload)
    }

    async addDependency(payload: Dependency) {
        this.dependencyManager.addDependency(payload)
    }
}