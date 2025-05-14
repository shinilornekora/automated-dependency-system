import { DependencyManager } from "./DependencyManager.js";
import { COMMON_COMMANDS } from "./types/commonCommands.js";
import { PROTECTED_COMMANDS } from "./types/protectedCommands.js";
import { User } from "./User.js";
import { Dependency } from "./Dependency.js";
import { HandlerPayloadMap } from "./types/HandlerPayloadMap.js";
import { NpmService } from "../infrastructure/NpmService.js";

const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

type CommandHandlerProps = {
    currentUser: User;
    dependencyManager: DependencyManager;
    npmService: NpmService;
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
    npmService: NpmService;
    currentUser: User;

    constructor({ currentUser, dependencyManager, npmService }: CommandHandlerProps) {
        this.currentUser = currentUser;
        this.dependencyManager = dependencyManager;
        this.npmService = npmService;
    }

    async handle<T extends CommandType>({ type, payload }: HandlerProps<T>) {
        const isCommonCommand = Object.values(COMMON_COMMANDS).includes(type as COMMON_COMMANDS);
        const isProtectedCommand = Object.values(PROTECTED_COMMANDS).includes(type as PROTECTED_COMMANDS);

        if (payload && process.env.DEBUG) {
            console.log(`\n
                type: ${type}
                payload: ${JSON.stringify(payload)}
            \n`);
        }

        if (!isCommonCommand && !isProtectedCommand) {
            throw new Error('No such command exist.');
        }

        if (isProtectedCommand && this.currentUser.checkIfCurrentPackageMaintainsByUser()) {
            // TS не может гарантировать соответствие сигнатур методов и типов — здесь это безопасно
            // Собраться на несуществующей команде он все равно не даст ибо упадет проверка CommandType.
            return await (this as any)[type](payload);
        }

        if (isCommonCommand) {
            // Аналогично комментарию выше, тут все безопасно.
            return await (this as any)[type](payload);
        }

        console.log(`\n
            You are trying to access protected command.
            You are not the author of this package. Operation aborted.
        \n`);

        throw new Error('restricted_access');
    }

    async initADS() {
        await this.dependencyManager.syncWithPackageJson();
        await this.dependencyManager.checkAndResolveCVEs();
        await this.dependencyManager.resolveConflicts();
        this.dependencyManager.lockAllCurrentVersions();
    }

    // Общий процесс проверки ADS.
    // 1. Убираем все неиспользующиеся зависимости
    // 2. Сканируем на уязвимости, даунгрейдим если крит
    // 3. Убираем все конфликты которые могли возникнуть
    // 4. Синхронизируем ADS файл с package.json
    // 5. Лочим все зависимости ADS
    async commonADSCheck() {
        console.log(`${colors.cyan}[STEP 1]:${colors.reset} remove unused dependencies started\n`);
        this.dependencyManager.removeUnusedDependencies();
        console.log(`\n${colors.green}[STEP 1]:${colors.reset} remove unused dependencies completed`);

        console.log(`${colors.cyan}[STEP 2]:${colors.reset} scanning the deps process started\n`);
        await this.dependencyManager.checkAndResolveCVEs();
        console.log(`\n${colors.green}[STEP 2]:${colors.reset} scanning the deps process completed`);

        console.log(`${colors.cyan}[STEP 3]:${colors.reset} conflicts resolve started\n`);
        await this.dependencyManager.resolveConflicts();
        console.log(`\n${colors.green}[STEP 3]:${colors.reset} conflicts resolve completed`);

        console.log(`${colors.cyan}[STEP 4]:${colors.reset} sync with package.json started\n`);
        await this.dependencyManager.syncWithPackageJson();
        console.log(`\n${colors.green}[STEP 4]:${colors.reset} sync with package.json completed`);

        console.log(`${colors.bold}${colors.cyan}[STEP 5]:${colors.reset} all current deps are being locked now\n`);
        this.dependencyManager.lockAllCurrentVersions();
        console.log(`\n${colors.bold}${colors.green}[STEP 5]:${colors.reset} all current deps are locked`);
    }

    async startApplication() {
        await this.commonADSCheck();
        await this.npmService.startApp();
    }

    async cleanInstallDependencies() {
        await this.commonADSCheck();
        this.dependencyManager.cleanInstallDependencies();
    }

    async deleteDependency({ depName }: { depName: string }) {
        await this.commonADSCheck();
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
        await this.commonADSCheck();
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
        await this.commonADSCheck();
        this.dependencyManager.triggerADSBuild();
    }

    async addDependency(payload: Dependency) {
        await this.commonADSCheck();
        this.dependencyManager.addDependency(payload);
    }

    async showThreeVersions({ depName }: HandlerPayloadMap['showThreeVersions']) {
        return await this.dependencyManager.getAllowedVersions({ depName });
    }

    async resolveConflicts() {
        return this.dependencyManager.resolveConflicts();
    }

    async getMaintainer() {
        return this.currentUser.isPackageMaintainer;
    }
}