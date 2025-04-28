import { DependencyManager } from "./DependencyManager";
import { COMMON_COMMANDS } from "./types/commonCommands";
import { PROTECTED_COMMANDS } from "./types/protectedCommands";
import { User } from "./User";

type CommandHandlerProps = {
    currentUser: User;
    dependencyManager: DependencyManager;
}

type HandlerProps = {
    type: PROTECTED_COMMANDS | COMMON_COMMANDS;
    payload: Record<string, unknown>;
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
            return this[PROTECTED_COMMANDS[type]](payload);
        }

        if (isCommonCommand) {
            return this[COMMON_COMMANDS[type]](payload);
        }

        throw new Error('Command is protected from you!')
    }

    async deleteDependency({ depName }) {
        await this.dependencyManager.removeDependency(depName)
    }

    async changeConfigurationFile(payload) {
        await this.dependencyManager.updateConfigurationFile(payload);
    }

    async replaceDependency(payload) {
        await this.dependencyManager.removeDependency(payload.depName);
        await this.dependencyManager.addDependency(payload)
    }

    async changeExistingDependencyHandler(payload: HandlerProps['payload']) {
        const secureVersions = await this.dependencyManager.getAllowedVersions(payload.depName);

        if (!secureVersions.includes(payload.depVersion)) {
            throw new Error('You are trying to install deps that beyond last three versions.')
        }

        await this.dependencyManager.removeDependency(payload.depName);
        await this.dependencyManager.addDependency(payload)
    }

    async addDependency(payload) {
        await this.dependencyManager.addDependency(payload)
    }
}