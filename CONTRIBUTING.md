# 贡献指南

感谢您考虑为 React Audio Studio 做出贡献！我们欢迎所有形式的贡献。

## 📋 目录

- [开发环境搭建](#开发环境搭建)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试](#测试)
- [发布流程](#发布流程)

## 🛠️ 开发环境搭建

### 前置条件

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0 或 pnpm >= 6.0.0

### 安装步骤

1. Fork 本仓库到你的 GitHub 账户
2. 克隆你的 Fork：

```bash
git clone https://github.com/your-username/react-audio-studio.git
cd react-audio-studio
```

3. 安装依赖：

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

4. 启动开发环境：

```bash
npm run dev
```

5. 启动示例项目：

```bash
npm run dev:example
```

## 📁 项目结构

```
react-audio-studio/
├── src/                           # 核心库源码
│   ├── hooks/                     # React Hooks
│   │   ├── useAudioRecording.ts   # 音频录制
│   │   ├── useAudioPlayer.ts      # 音频播放
│   │   ├── useAudioProcessing.ts  # 音频处理
│   │   └── useDeviceAudioCapabilities.ts # 设备检测
│   ├── types/                     # TypeScript 类型定义
│   │   └── index.ts
│   └── index.ts                   # 入口文件
├── examples/                      # 示例项目
│   ├── basic-example/             # 基础示例
│   └── antd-example/              # Ant Design 集成示例
├── dist/                          # 构建输出
├── .eslintrc.cjs                  # ESLint 配置
├── .gitignore                     # Git 忽略文件
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 构建配置
└── README.md                      # 项目文档
```

## 🔄 开发流程

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
# 或
git checkout -b docs/your-documentation-update
```

### 2. 开发和测试

- 在 `src/` 目录下进行开发
- 确保新功能有相应的 TypeScript 类型定义
- 在 `examples/` 中测试你的更改
- 运行类型检查：`npm run type-check`
- 运行代码检查：`npm run lint`

### 3. 提交更改

```bash
git add .
git commit -m "feat: add new audio processing feature"
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

- 在 GitHub 上创建 Pull Request
- 详细描述你的更改
- 确保所有检查都通过

## 📝 代码规范

### TypeScript

- 使用严格的 TypeScript 配置
- 为所有公共 API 提供类型定义
- 避免使用 `any` 类型，必要时使用 `unknown`

### React Hooks

- 遵循 React Hooks 规则
- 使用 `useCallback` 和 `useMemo` 优化性能
- 正确处理依赖数组

### 命名规范

- 使用 PascalCase 命名组件和类型
- 使用 camelCase 命名变量和函数
- 使用 kebab-case 命名文件（除了组件文件）

### 示例代码

```tsx
// 好的示例
interface AudioProcessingParams {
  sampleRate: SampleRate;
  bitRate: BitRate;
}

export const useAudioProcessing = (options: UseAudioProcessingOptions = {}) => {
  const [params, setParams] = useState<AudioProcessingParams>(defaultParams);
  
  const updateParams = useCallback((updates: Partial<AudioProcessingParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  }, []);
  
  return {
    params,
    updateParams,
  };
};
```

### ESLint 规则

我们使用以下 ESLint 规则：

- `@typescript-eslint/recommended`
- `react-hooks/recommended`
- 禁止未使用的变量（以 `_` 开头的变量除外）

运行 linter：

```bash
npm run lint
npm run lint:fix  # 自动修复可修复的问题
```

## 📮 提交规范

我们使用[约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)规范：

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响代码逻辑）
- `refactor`: 重构代码（既不是新功能也不是修复 bug）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 其他更改（如构建流程、辅助工具等）

### 提交格式

```
type(scope): description

[optional body]

[optional footer]
```

### 示例

```bash
feat(hooks): add audio segment selection feature

- Add setSegment method to useAudioPlayer
- Support playing specific audio segments
- Update types for AudioSegment interface

Closes #123
```

## 🧪 测试

### 运行测试

```bash
npm run test           # 运行测试
npm run test:ui        # 运行测试 UI
npm run test:coverage  # 运行测试覆盖率
```

### 编写测试

- 为新功能编写单元测试
- 确保测试覆盖率不降低
- 使用 Vitest 作为测试框架

### 测试示例

```typescript
import { renderHook } from '@testing-library/react';
import { useAudioPlayer } from '../useAudioPlayer';

describe('useAudioPlayer', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioPlayer());
    
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.volume).toBe(1);
  });
});
```

## 🎯 功能开发指南

### 添加新的 Hook

1. 在 `src/hooks/` 目录下创建新文件
2. 实现 Hook 逻辑
3. 添加 TypeScript 类型定义
4. 在 `src/hooks/index.ts` 中导出
5. 在 `examples/` 中添加使用示例
6. 更新文档

### 修改现有功能

1. 确保向后兼容
2. 更新相关类型定义
3. 更新示例代码
4. 更新文档

### 性能优化

- 使用 `useCallback` 缓存函数
- 使用 `useMemo` 缓存计算结果
- 避免不必要的重新渲染
- 正确管理资源清理

## 🚀 发布流程

### 版本管理

我们使用[语义化版本](https://semver.org/lang/zh-CN/)：

- `主版本号`: 不兼容的 API 修改
- `次版本号`: 向下兼容的功能性新增
- `修订版本号`: 向下兼容的问题修正

### 发布步骤

1. 更新版本号在 `package.json`
2. 更新 `CHANGELOG.md`
3. 创建 git tag
4. 发布到 npm

```bash
npm run clean      # 清理构建目录
npm run build      # 构建项目
npm run test       # 运行测试
npm publish        # 发布到 npm
```

## 🐛 问题报告

### 创建 Issue

- 使用清晰的标题
- 提供复现步骤
- 包含环境信息
- 提供最小复现示例

### Bug 报告模板

```markdown
**问题描述**
简要描述问题

**复现步骤**
1. 执行 '...'
2. 点击 '....'
3. 查看错误

**期望行为**
描述期望的行为

**环境信息**
- OS: [e.g. macOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
- React Audio Studio Version: [e.g. 0.1.0]

**附加信息**
其他相关信息
```

## 🔗 相关资源

- [React Hooks 文档](https://reactjs.org/docs/hooks-intro.html)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/)
- [Vitest 文档](https://vitest.dev/)
- [ESLint 文档](https://eslint.org/)

## 📞 联系我们

如果你有任何问题，可以通过以下方式联系我们：

- 创建 GitHub Issue
- 发送邮件到项目维护者
- 加入我们的讨论群

感谢您的贡献！🎉 