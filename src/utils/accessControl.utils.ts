import { UserAccess } from "../types/auth.types";

/**
 * Utility functions for access control
 */
export class AccessControlUtils {
  /**
   * Get all menu items that a user has access to for a specific module
   */
  static getAccessibleMenus(
    accesses: UserAccess[],
    moduleName: string
  ): UserAccess[] {
    return accesses.filter(
      (access) =>
        access.level_type === "MENU" && access.parent_name === moduleName
    );
  }

  /**
   * Get all submenu items that a user has access to for a specific menu
   */
  static getAccessibleSubmenus(
    accesses: UserAccess[],
    menuName: string,
    moduleName: string
  ): UserAccess[] {
    return accesses.filter(
      (access) =>
        access.level_type === "SUBMENU" &&
        access.parent_name === menuName &&
        access.grandparent_name === moduleName
    );
  }

  /**
   * Check if user has specific access type (READ, WRITE, DELETE) for a menu or submenu
   */
  static hasAccessType(
    accesses: UserAccess[],
    itemName: string,
    accessType: "READ" | "WRITE" | "DELETE",
    levelType: "MENU" | "SUBMENU"
  ): boolean {
    return accesses.some(
      (access) =>
        access.name === itemName &&
        access.level_type === levelType &&
        access.access_type === accessType
    );
  }

  /**
   * Get user's role-based access summary
   */
  static getAccessSummary(accesses: UserAccess[]): {
    modules: string[];
    menus: string[];
    submenus: string[];
    readAccess: number;
    writeAccess: number;
    deleteAccess: number;
  } {
    const modules = [
      ...new Set(
        accesses
          .filter((access) => access.level_type === "MODULE")
          .map((access) => access.name)
      ),
    ];

    const menus = [
      ...new Set(
        accesses
          .filter((access) => access.level_type === "MENU")
          .map((access) => access.name)
      ),
    ];

    const submenus = [
      ...new Set(
        accesses
          .filter((access) => access.level_type === "SUBMENU")
          .map((access) => access.name)
      ),
    ];

    const readAccess = accesses.filter(
      (access) => access.access_type === "READ"
    ).length;
    const writeAccess = accesses.filter(
      (access) => access.access_type === "WRITE"
    ).length;
    const deleteAccess = accesses.filter(
      (access) => access.access_type === "DELETE"
    ).length;

    return {
      modules,
      menus,
      submenus,
      readAccess,
      writeAccess,
      deleteAccess,
    };
  }
}
