import { logicHooksManager } from './logic_hooks_manager';

logicHooksManager.registerHook('beforeCoreFunction', (p) => {
  console.log('执行通用逻辑逻辑前置调用', p);
  throw new Error('测试hook中抛出异常');
});

// 通用的逻辑，比如检索知识库

logicHooksManager.executeHooks('beforeCoreFunction', 'a');

console.log('执行通用逻辑逻辑');

logicHooksManager.executeHooks('afterCoreFunction');
