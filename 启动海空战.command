#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  print '需要 Node.js 18 或以上版本。安装后重新双击此文件。'
  read 'reply?按回车关闭…'
  exit 1
fi
node server.mjs --open
