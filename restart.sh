#!/bin/bash

cd projects/app


pnpm install
pnpm build

# 查找监听3000端口的进程
PID=$(netstat -anp | grep ':3000' | grep LISTEN | awk '{print $7}' | cut -d'/' -f1)

# 检查是否找到了进程
if [ -z "$PID" ]; then
    echo "没有找到监听3000端口的进程。"
    # 使用forever启动应用
    forever start -a -l /root/FastGPT/out.log -o /root/FastGPT/out.log -e /root/FastGPT/out.log -c "pnpm start" .
else
    # 杀死这个进程
    kill $PID
    echo "进程已被杀死。会自动被forever拉起来"
fi

echo "脚本执行完成！"
