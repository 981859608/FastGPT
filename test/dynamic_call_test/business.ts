// business.ts
import { logicHooksManager } from './logic_hooks_manager';

// 注册自定义逻辑到钩子
logicHooksManager.registerHook('beforeCoreFunction', () => {
  console.log('Custom logic before core function');
});

logicHooksManager.registerHook('afterCoreFunction', () => {
  console.log('Custom logic after core function');
});

// 运行核心功能
// coreFunction();
