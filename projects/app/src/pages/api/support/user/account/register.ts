// pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password } = req.body;

    if (!username || !password) {
      throw new Error('缺少参数');
    }

    // 检测用户是否存在
    const existingUser = await MongoUser.findOne({ username });
    if (existingUser) {
      throw new Error('用户已存在');
    }

    let userId = '';

    await mongoSessionRun(async (session) => {
      // 创建新用户
      const [{ _id }] = await MongoUser.create(
        [
          {
            username,
            password: hashStr(password)
          }
        ],
        { session }
      );
      userId = _id;

      // 每个人单独一个团队，防止数据混在一起
      await createDefaultTeam({ userId, balance: 9999 * PRICE_SCALE, session });
    });

    jsonRes(res, {
      data: {
        message: '注册成功',
        userId
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
