import {COMMON_COMMANDS} from "./commonCommands.js";
import {Dependency} from "../Dependency.js";
import {PROTECTED_COMMANDS} from "./protectedCommands.js";

export type Nothing = Record<string, never>

export type HandlerPayloadMap = {
    // Всем разрешенные команды
    [COMMON_COMMANDS.INIT_ADS]: Nothing;
    [COMMON_COMMANDS.CHANGE_CONFIGURATION_FILE]: Nothing;
    [COMMON_COMMANDS.CHANGE_EXISTING_DEPENDENCY]: Dependency;
    [COMMON_COMMANDS.RESOLVE_CONFLICTS]: Nothing;
    [COMMON_COMMANDS.GET_MAINTAINER]: Nothing;
    [COMMON_COMMANDS.COMMON_ADS_CHECK]: Nothing;
    [COMMON_COMMANDS.CLEAN_INSTALL_DEPENDENCIES]: Nothing;
    [COMMON_COMMANDS.INSTALL_DEPENDENCIES]: string[]
    [COMMON_COMMANDS.SHOW_THREE_VERSIONS]: { depName: string };
    [COMMON_COMMANDS.TRIGGER_ADS_BUILD]: Nothing;
    [COMMON_COMMANDS.START_APPLICATION]: Nothing;

    // Требуется проверка доступа
    [PROTECTED_COMMANDS.DELETE_DEPENDENCY]: { depName: string };
    [PROTECTED_COMMANDS.REPLACE_DEPENDENCY]: Dependency;
    [PROTECTED_COMMANDS.ADD_DEPENDENCY]: Dependency;
};
