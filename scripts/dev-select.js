#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🎵 React Audio Studio 开发环境选择\n');
console.log('请选择要运行的开发环境:');
console.log('1. Antd 示例 (推荐)');
console.log('2. Basic 示例');
console.log('3. 组件库开发模式');
console.log('');

rl.question('请输入选择 (1-3): ', (answer) => {
  let command;
  let args;
  
  switch (answer.trim()) {
    case '1':
      console.log('\n🚀 启动 Antd 示例...\n');
      command = 'yarn';
      args = ['dev:antd'];
      break;
    case '2':
      console.log('\n🚀 启动 Basic 示例...\n');
      command = 'yarn';
      args = ['dev:basic'];
      break;
    case '3':
      console.log('\n🚀 启动组件库开发模式...\n');
      command = 'yarn';
      args = ['dev:lib'];
      break;
    default:
      console.log('\n❌ 无效选择，默认启动 Antd 示例...\n');
      command = 'yarn';
      args = ['dev:antd'];
      break;
  }
  
  rl.close();
  
  // 启动选择的开发环境
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error('启动失败:', error);
    process.exit(1);
  });
  
  child.on('close', (code) => {
    process.exit(code);
  });
}); 