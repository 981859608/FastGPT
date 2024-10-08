import type { NextApiRequest } from 'next';
import type { SearchTestProps } from '@/global/core/dataset/api.d';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { pushGenerateVectorUsage } from '@/service/support/wallet/usage/push';
import { searchDatasetData } from '@fastgpt/service/core/dataset/search/controller';
import { updateApiKeyUsage } from '@fastgpt/service/support/openapi/tools';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { getLLMModel } from '@fastgpt/service/core/ai/model';
import { datasetSearchQueryExtension } from '@fastgpt/service/core/dataset/search/utils';
import {
  checkTeamAIPoints,
  checkTeamReRankPermission
} from '@fastgpt/service/support/permission/teamLimit';
import { NextAPI } from '@/service/middleware/entry';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

async function handler(req: NextApiRequest) {
  let {
    datasetId,
    datasetIds,
    env,
    text,
    limit = 1500,
    similarity,
    searchMode,
    usingReRank,

    datasetSearchUsingExtensionQuery = true,
    datasetSearchExtensionModel,
    datasetSearchExtensionBg = ''
  } = req.body as SearchTestProps;
  /**
   * 1.鉴权
   * 2.校验余额
   * 3.执行扩展（如使用gpt-4o-mini对问题进行优化，以提高命中）
   * 4.执行查询
   *  4.1.输入文本转向量
   *  4.2.去pg召回
   *  4.3.结果处理（其中包含排序）
   *  4.4.根据collectionId反查原始数据，并拼接到返回值中
   *  4.5.返回结果
   * 5.计算消耗并保存消费记录
   * 6.更新apiKey使用记录（如果是通过apiKey访问的话）
   */

  // 使该接口支持传入多个知识库ID，也要兼容之前只传入一个知识库的情况，所以做以下两种情况的赋值
  // 如果 datasetIds 不为空，datasetId = datasetIds[0]
  if (datasetIds && datasetIds.length > 0) {
    datasetId = datasetIds[0];
  }
  // 如果 datasetIds 为空，datasetIds = [datasetId]
  if (!datasetIds || datasetIds.length === 0) {
    datasetIds = [datasetId];
  }

  if (!datasetId || !text) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const start = Date.now();

  // auth dataset role
  const { dataset, teamId, tmbId, apikey } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    datasetId,
    per: ReadPermissionVal
  });
  // auth balance
  await checkTeamAIPoints(teamId);

  // query extension
  const extensionModel =
    datasetSearchUsingExtensionQuery && datasetSearchExtensionModel
      ? getLLMModel(datasetSearchExtensionModel)
      : undefined;
  const { concatQueries, rewriteQuery, aiExtensionResult } = await datasetSearchQueryExtension({
    query: text,
    extensionModel,
    extensionBg: datasetSearchExtensionBg
  });

  const { searchRes, tokens, ...result } = await searchDatasetData({
    teamId,
    reRankQuery: rewriteQuery,
    queries: concatQueries,
    model: dataset.vectorModel,
    limit: Math.min(limit, 20000),
    similarity,
    datasetIds: datasetIds,
    searchMode,
    usingReRank: usingReRank && (await checkTeamReRankPermission(teamId))
  });

  // 执行钩子扣减余额
  // logicHooksManager.executeHooks(HookNameEnum.reduceTeamBalance, {
  //   teamId,
  //   tmbId,
  //   tokens,
  //   model: dataset.vectorModel,
  //   source: apikey ? UsageSourceEnum.api : UsageSourceEnum.fastgpt,
  //   duration: Date.now() - start,

  //   ...(aiExtensionResult &&
  //     extensionModel && {
  //       extensionModel: extensionModel.name,
  //       extensionTokens: aiExtensionResult.tokens
  //     }),
  //   env
  // });

  // push bill
  const { totalPoints } = pushGenerateVectorUsage({
    teamId,
    tmbId,
    tokens,
    model: dataset.vectorModel,
    source: apikey ? UsageSourceEnum.api : UsageSourceEnum.fastgpt,

    ...(aiExtensionResult &&
      extensionModel && {
        extensionModel: extensionModel.name,
        extensionTokens: aiExtensionResult.tokens
      })
  });
  if (apikey) {
    updateApiKeyUsage({
      apikey,
      totalPoints: totalPoints
    });
  }

  return {
    list: searchRes,
    duration: `${((Date.now() - start) / 1000).toFixed(3)}s`,
    queryExtensionModel: aiExtensionResult?.model,
    ...result
  };
}

export default NextAPI(handler);
