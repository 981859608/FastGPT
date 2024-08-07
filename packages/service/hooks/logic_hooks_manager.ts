// LogicHooksManager.ts
import { HookNameEnum } from './constants';

export type HookFunction = (...args: any[]) => void;

class LogicHooksManager {
  private hooks: { [key in HookNameEnum]?: HookFunction[] } = {};

  registerHook(hookName: HookNameEnum, fn: HookFunction) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    this.hooks[hookName].push(fn);
  }

  executeHooks(hookName: HookNameEnum, ...args: any[]) {
    if (this.hooks[hookName]) {
      for (const fn of this.hooks[hookName]) {
        fn(...args);
      }
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
