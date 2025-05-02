import { FileSystemAPI } from './infrastructure/FileSystemAPI.js';
import { DependencyRepository } from './infrastructure/DependencyRepository.js';
import { CVEScanner } from './infrastructure/CVEScanner.js';
import { NpmService } from './infrastructure/NpmService.js';
import { DependencyManager } from './domain/DependencyManager.js';
import { DependencyResolver } from './domain/DependencyResolver.js';
import { DependencyService } from './application/DependencyService.js';
import { User } from "./domain/User.js";
import { CommandHandler } from "./domain/CommandHandler.js";

// Функция, которую можно импортировать в любой пакет.
export function createADS(currentUsername: string) {
    const currentUser = new User({ name: currentUsername });
    const melIgnoreList = FileSystemAPI.readMelIgnore();
    const dependencyRepository = new DependencyRepository();
    const cveScanner = new CVEScanner();
    const npmService = new NpmService(currentUser);
    const dependencyResolver = new DependencyResolver({});
    const dependencyManager = new DependencyManager({
        dependencyRepository,
        dependencyResolver,
        cveScanner,
        currentUser,
        melIgnoreList,
        npmService
    });

    const commandHandler = new CommandHandler({ currentUser, dependencyManager });

    const dependencyService = new DependencyService({
        dependencyManager,
        log: console.log,
        commandHandler,
    });

    return {
        dependencyRepository,
        dependencyManager,
        dependencyService,
    };
}
