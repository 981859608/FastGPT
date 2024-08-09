import axios from 'axios';
import { logicHooksManager } from '@fastgpt/service/hooks/logic_hooks_manager';
import { HookNameEnum } from '@fastgpt/service/hooks/constants';

// 常量配置
const CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    pwd: 'KU&SIUoierjefo9e798wehfl'
  }
};

// 根据传过来的env获取Java服务ip
function getJavaServerHost(env: string) {
  if (env === 'test') {
    return 'http://172.19.0.11';
  } else {
    return 'http://172.19.0.14';
  }
}

logicHooksManager.registerHook(HookNameEnum.checkTeamBalance, async (teamId, env) => {
  try {
    const response = await axios.get(
      `${getJavaServerHost(env)}/luomacode-api/inner/rag/canUseAI/balanceInfo`,
      {
        params: { teamId },
        headers: CONFIG.headers
      }
    );

    const { data } = response;
    if (data.code === 0 && data.data > 0) {
      console.log('余额充足');
    } else {
      throw new Error('余额不足');
    }
  } catch (error) {
    console.error('检查余额时发生错误:', error);
    throw error; // 抛出异常以便调用者处理
  }
});

logicHooksManager.registerHook(HookNameEnum.reduceTeamBalance, async (...params) => {
  try {
    console.log('params========', params);
    for (const param of params) {
      const {
        teamId,
        tmbId,
        tokens,
        model,
        source,
        duration,
        extensionModel,
        extensionTokens,
        env
      } = param;

      let allTokens = tokens;
      if (extensionTokens && extensionTokens > 0) {
        allTokens += extensionTokens;
      }

      const requestBody = {
        teamId,
        mossModelCodeName: model,
        questionTokens: allTokens,
        answerTokens: 0,
        elapsedTime: duration
      };

      const response = await axios.post(
        `${getJavaServerHost(env)}/luomacode-api/inner/rag/canUseAI/balance`,
        requestBody,
        { headers: CONFIG.headers }
      );

      const { data } = response;
      if (data.code === 0) {
        console.log('余额减少成功');
      } else {
        throw new Error('余额减少失败');
      }
    }
  } catch (error) {
    console.error('减少余额时发生错误:', error);
    throw error; // 抛出异常以便调用者处理
  }
});
