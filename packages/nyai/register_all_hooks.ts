import { logicHooksManager } from '@fastgpt/service/hooks/logic_hooks_manager';
import { HookNameEnum } from '@fastgpt/service/hooks/constants';

logicHooksManager.registerHook(HookNameEnum.checkTeamBalance, (teamId) => {
  console.log('注入钩子 执行通用逻辑前置调用, teamId = ', teamId);
});

console.log('注入钩子');
