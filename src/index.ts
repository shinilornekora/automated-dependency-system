import { FileSystemAPI } from './infrastructure/FileSystemAPI';
import { DependencyRepository } from './infrastructure/DependencyRepository';
import { CVEScanner } from './infrastructure/CVEScanner';
import { NpmService } from './infrastructure/NpmService';
import { DependencyManager } from './domain/DependencyManager';
import { DependencyResolver } from './domain/DependencyResolver';
import { DependencyService } from './application/DependencyService';
import { User } from "./domain/User";
import {CommandHandler} from "./domain/Command";

// Функция, которую можно импортировать в любой пакет.
export function createADS(currentUsername: string) {
    const currentUser = new User({ name: currentUsername, isPackageMaintainer: false });
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
        melIgnoreList
    });

    const commandHandler = new CommandHandler({ currentUser, dependencyManager });

    const dependencyService = new DependencyService({
        dependencyManager,
        log: console.log,
        commandHandler,
        npmService
    });

    return {
        dependencyRepository,
        dependencyManager,
        dependencyService,
    };
}
