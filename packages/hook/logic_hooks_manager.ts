// LogicHooksManager.ts
// 同一个函数名，只注册一个

export enum HookNameEnum {
  // 前置检查余额
  checkTeamBalance = 'checkTeamBalance',
  // 执行后置扣费逻辑
  reduceTeamBalance = 'reduceTeamBalance'
}

export type HookFunction = (...args: any[]) => void;

class LogicHooksManager {
  private hooks: { [key in HookNameEnum]?: HookFunction } = {};

  registerHook(hookName: HookNameEnum, fn: HookFunction) {
    // 直接覆盖同一个 hookName 的函数
    this.hooks[hookName] = fn;
  }

  executeHooks(hookName: HookNameEnum, ...args: any[]) {
    const fn = this.hooks[hookName];
    if (fn) {
      fn(...args);
    } else {
      console.log('没有找到hookName对应的的函数', hookName);
    }
  }
}

// 使用单例模式确保全局只有一个 LogicHooksManager 实例
class LogicHooksManagerSingleton {
  private static instance: LogicHooksManager;

  private constructor() {}

  public static getInstance(): LogicHooksManager {
    if (!LogicHooksManagerSingleton.instance) {
      LogicHooksManagerSingleton.instance = new LogicHooksManager();
    }
    return LogicHooksManagerSingleton.instance;
  }
}

export const logicHooksManager = LogicHooksManagerSingleton.getInstance();
