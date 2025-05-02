import { DependencyManager } from "./DependencyManager.js";
import { COMMON_COMMANDS } from "./types/commonCommands.js";
import { PROTECTED_COMMANDS } from "./types/protectedCommands.js";
import { User } from "./User.js";
import {Dependency} from "./Dependency.js";
import {HandlerPayloadMap} from "./types/HandlerPayloadMap.js";

type CommandHandlerProps = {
    currentUser: User;
    dependencyManager: DependencyManager;
}

type CommandType = COMMON_COMMANDS | PROTECTED_COMMANDS;

type HandlerProps<T extends CommandType = CommandType> = {
    type: T;
    payload: HandlerPayloadMap[T];
};

/**
 * Класс управления обработкой команд.
 * Каждый метод вызывается на имя команды, сами они поделены на приватные и обычные.
 * Логика валидации роли проходит на этом этапе, в методе handle.
 *
 * Карта нагрузочных типов ставится в соответствие благодаря HandlerPayloadMap.
 */
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

        if (payload) {
            console.log(`type: ${type}`);
            console.log(`payload: ${JSON.stringify(payload)}`);
        }

        if (!isCommonCommand && !isProtectedCommand) {
            throw new Error('No such command exist.');
        }

        if (isProtectedCommand && this.currentUser.isPackageMaintainer) {
            // TS не может гарантировать соответствие сигнатур методов и типов — здесь это безопасно
            // Собраться на несуществующей команде он все равно не даст ибо упадет проверка CommandType.
            return await (this as any)[type](payload);
        }

        if (isCommonCommand) {
            // Аналогично комментарию выше, тут все безопасно.
            return await (this as any)[type](payload);
        }

        throw new Error('Command is protected from you!');
    }

    async initADS() {
        await this.dependencyManager.syncWithPackageJson();
    }

    async commonADSCheck() {
        await this.dependencyManager.checkAndResolveCVEs();
        this.dependencyManager.removeUnusedDependencies();
        this.dependencyManager.lockAllCurrentVersions();
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

    async installDeps(payload: string[]) {
        this.dependencyManager.installDeps(payload);
    }

    async changeExistingDependencyHandler(payload: Dependency) {
        const secureVersions = await this.dependencyManager.getAllowedVersions({ depName: payload.getName });

        if (secureVersions && !secureVersions.includes(payload.getVersion)) {
            throw new Error('You are trying to install deps that beyond last three versions.');
        }

        this.dependencyManager.removeDependency(payload.getName);
        this.dependencyManager.addDependency(payload);
    }

    async triggerADSBuild() {
        this.dependencyManager.triggerADSBuild();
    }

    async addDependency(payload: Dependency) {
        this.dependencyManager.addDependency(payload);
    }

    async showThreeVersions({ depName }: HandlerPayloadMap['showThreeVersions']) {
        return await this.dependencyManager.getAllowedVersions({ depName });
    }

    async resolveConflicts() {
        return this.dependencyManager.checkAndResolveCVEs()
    }
}