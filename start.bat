@echo off
chcp 65001 >nul
title 三级项目本地服务 - 王子涵 0807
cd /d %~dp0backend
echo 正在启动后端服务（端口 8807）...
echo 启动后请访问 http://localhost:8807
echo.
call npm run dev
echo.
echo 服务已退出，如有报错请查看上方信息。
pause
