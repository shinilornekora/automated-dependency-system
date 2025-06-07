import { CommandHandler, HandlerProps } from "./CommandHandler.js";
import { DependencyManager } from "./DependencyManager.js";
import { HandlerPayloadMap } from "./types/HandlerPayloadMap.js";
import { NpmService } from "../infrastructure/NpmService.js";
import { User } from "./User.js";
import { Dependency } from "./Dependency.js";
import { PROTECTED_COMMANDS } from "./types/protectedCommands.js";
import { COMMON_COMMANDS } from "./types/commonCommands.js";

class MockDependencyManager extends DependencyManager {
    syncWithPackageJson = jest.fn();
    checkAndResolveCVEs = jest.fn();
    resolveConflicts = jest.fn();
    lockAllCurrentVersions = jest.fn();
    removeUnusedDependencies = jest.fn();
    updateConfigurationFile = jest.fn();
    removeDependency = jest.fn();
    addDependency = jest.fn();
    installDeps = jest.fn();
    getAllowedVersions = jest.fn().mockReturnValue(["1.2.3", "1.1.2", "1.0.1"]);
    triggerADSBuild = jest.fn();
}

class MockNpmService extends NpmService {
    startApp = jest.fn();
}

class MockUser extends User {
    checkIfCurrentPackageMaintainsByUser = jest.fn().mockReturnValue(true);

}

describe("CommandHandler", () => {
    let dependencyManager: MockDependencyManager;
    let npmService: MockNpmService;
    let currentUser: MockUser;

    beforeEach(() => {
        currentUser = new MockUser({ name: 'test' });
        dependencyManager = new MockDependencyManager({} as any);
        npmService = new MockNpmService(currentUser);
    });

    it("should throw error when command not exists", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });
        await expect(commandHandler.handle({ type: "invalidCommand", payload: {} } as any)).rejects.toThrow("No such command exist.");
    });

    it("should handle protected command with correct user role", async () => {
        dependencyManager.removeDependency.mockImplementation(() => {});
        dependencyManager.addDependency.mockImplementation(() => {});
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "deleteDependency" as PROTECTED_COMMANDS.DELETE_DEPENDENCY,
            payload: { depName: "sampleDep" }
        } );

        expect(dependencyManager.removeUnusedDependencies).toHaveBeenCalled();
        expect(dependencyManager.removeDependency).toHaveBeenCalledWith("sampleDep");
    });

    it("should not allow protected commands with invalid user role", async () => {
        (currentUser.checkIfCurrentPackageMaintainsByUser as jest.Mock).mockReturnValueOnce(false);
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await expect(commandHandler.handle({
            type: "deleteDependency" as PROTECTED_COMMANDS.DELETE_DEPENDENCY,
            payload: { depName: "sampleDep" }
        })).rejects.toThrow("restricted_access");
    });

    it("should handle common command with proper permissions", async () => {
        dependencyManager.addDependency.mockImplementation(() => {});
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "addDependency" as PROTECTED_COMMANDS.ADD_DEPENDENCY,
            payload: { name: "sampleDep", version: "1.0.0", simpleName: "sampleDep", scope: "dependencies" } as any
        });

        expect(dependencyManager.removeUnusedDependencies).toHaveBeenCalled();
        expect(dependencyManager.addDependency).toHaveBeenCalledWith({ name: "sampleDep", version: "1.0.0", simpleName: "sampleDep", scope: "dependencies" });
    });

    it("should handle 'showThreeVersions' by returning allowed versions", async () => {
        dependencyManager.getAllowedVersions.mockImplementation(({ depName }) => {
            if (depName === "testDep") return ["1.2.3", "1.1.2", "1.0.1"];
            else return null;
        });

        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        const result = await commandHandler.handle({
            type: "showThreeVersions" as COMMON_COMMANDS.SHOW_THREE_VERSIONS,
            payload: { depName: "testDep" }
        });

        expect(result).toEqual(["1.2.3", "1.1.2", "1.0.1"]);
    });

    it("should call 'npmService.startApp' when executing 'startApplication' command", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "startApplication" as COMMON_COMMANDS.START_APPLICATION,
            payload: {}
        });

        expect(npmService.startApp).toHaveBeenCalled();
    });

    it("should call 'cleanInstallDependencies' when executing 'cleanInstallDependencies'", async () => {
        dependencyManager.cleanInstallDependencies = jest.fn();
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "cleanInstallDependencies" as COMMON_COMMANDS.CLEAN_INSTALL_DEPENDENCIES,
            payload: {}
        });

        expect(dependencyManager.cleanInstallDependencies).toHaveBeenCalled();
    });

    it("should call 'installDeps' and install provided packages", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "installDeps" as COMMON_COMMANDS.INSTALL_DEPENDENCIES,
            payload: ["lodash", "react"]
        });

        expect(dependencyManager.installDeps).toHaveBeenCalledWith(["lodash", "react"]);
    });

    it("should modify existing dependency with allowed version", async () => {
        (dependencyManager.getAllowedVersions as jest.Mock).mockImplementation(({ depName }) => {
            if (depName === "testDep") return ["1.2.3", "1.1.2", "1.0.1"];
            return null;
        });

        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });
        const dependency = {
            getName: () => "testDep",
        } as unknown as Dependency;

        await commandHandler.handle({
            type: "changeExistingDependencyHandler" as COMMON_COMMANDS.CHANGE_EXISTING_DEPENDENCY,
            payload: dependency
        });

        expect(dependencyManager.removeDependency).toHaveBeenCalledWith(dependency.getName);
        expect(dependencyManager.addDependency).toHaveBeenCalledWith(dependency);
    });

    it("should resolve conflicts when executing 'resolveConflicts' command", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "resolveConflicts" as COMMON_COMMANDS.RESOLVE_CONFLICTS,
            payload: {}
        });

        expect(dependencyManager.resolveConflicts).toHaveBeenCalled();
    });

    it("should perform init ads steps", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "initADS" as COMMON_COMMANDS.INIT_ADS,
            payload: {}
        });

        expect(dependencyManager.syncWithPackageJson).toHaveBeenCalled();
        expect(dependencyManager.checkAndResolveCVEs).toHaveBeenCalled();
        expect(dependencyManager.resolveConflicts).toHaveBeenCalled();
        expect(dependencyManager.lockAllCurrentVersions).toHaveBeenCalled();
    });

    it("should trigger ADS build when executing 'triggerADSBuild' command", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });

        await commandHandler.handle({
            type: "triggerADSBuild" as COMMON_COMMANDS.TRIGGER_ADS_BUILD,
            payload: {}
        });

        expect(dependencyManager.resolveConflicts).toHaveBeenCalled();
        expect(dependencyManager.triggerADSBuild).toHaveBeenCalled();
    });

    it("should update configuration file with given payload", async () => {
        const commandHandler = new CommandHandler({ currentUser, dependencyManager, npmService });
        const stub = {}

        await commandHandler.handle({
            type: "changeConfigurationFile" as COMMON_COMMANDS.CHANGE_CONFIGURATION_FILE,
            payload: stub
        });

        expect(dependencyManager.updateConfigurationFile).toHaveBeenCalledWith(stub);
    });
});
