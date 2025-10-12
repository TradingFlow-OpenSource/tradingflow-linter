# Weather 类型系统指南

本文档介绍 TradingFlow Weather 语法的完整类型系统。

---

## 📁 文件结构

```
21_weather_linter/
├── src/
│   ├── types/
│   │   ├── weather.ts       # Weather 核心类型定义
│   │   └── converters.ts    # Full/Essential 转换工具
│   └── types.ts             # 统一导出入口
└── TYPES_GUIDE.md           # 本文档
```

---

## 🎯 类型系统概述

Weather 语法有两个版本：

### 📦 Essential 版本（核心版）
- **用途**: 后端存储、API 传输、Agent 生成
- **特点**: 精简、只包含核心业务逻辑
- **文件大小**: 比 Full 版本小 60%

**类型前缀**: `Essential*`
- `EssentialNode`
- `EssentialEdge`
- `EssentialFlow`
- `EssentialInput`
- `EssentialOutput`

### 🖥️ Full 版本（完整版）
- **用途**: 前端展示、用户交互、UI 状态
- **特点**: 包含所有字段，包括 UI 状态和样式
- **文件大小**: 完整，包含冗余信息

**类型前缀**: `Full*`
- `FullNode`
- `FullEdge`
- `FullFlow`
- `FullInput`
- `FullOutput`

---

## 📚 主要类型

### 1. 工作流类型

```typescript
// Essential 版本
interface EssentialFlow {
  thumbnailUrl?: string;
  name: string;
  nodes: EssentialNode[];
  edges: EssentialEdge[];
}

// Full 版本
interface FullFlow extends EssentialFlow {
  nodes: FullNode[];
  edges: FullEdge[];
}
```

### 2. 节点类型

```typescript
// Essential 节点
interface EssentialNode {
  position: Position;
  id: string;
  type: NodeType;
  data: EssentialNodeData;
}

// Full 节点（扩展）
interface FullNode extends EssentialNode {
  data: FullNodeData;
  className?: string;
  width?: number;
  height?: number;
  selected?: boolean;
  positionAbsolute?: Position;
  dragging?: boolean;
}
```

### 3. 节点数据类型

```typescript
// Essential 节点数据
interface EssentialNodeData {
  title: string;
  description: string;
  collection: NodeCollection;
  inputs: EssentialInput[];
  outputs: EssentialOutput[];
}

// Full 节点数据（扩展）
interface FullNodeData extends EssentialNodeData {
  inputs: FullInput[];
  outputs: FullOutput[];
  id: string;
  edges: FullEdge[];
  menuItems?: MenuItem[];
  isDeepEdit?: boolean;
  isFlowExecuting?: boolean;
  isStopping?: boolean;
  signals?: HandleSignal[];
}
```

### 4. 边类型

```typescript
// Essential 边
interface EssentialEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

// Full 边（扩展）
interface FullEdge extends EssentialEdge {
  type?: EdgeType;
  animated?: boolean;
}
```

---

## 🔧 使用方法

### 在前端使用

```typescript
// 1. 导入类型
import { 
  FullFlow, 
  FullNode, 
  FullEdge,
  NodeExecutionState,
  HandleSignal 
} from '@tradingflow/weather-linter';

// 2. 使用类型
const flow: FullFlow = {
  name: 'My Flow',
  nodes: [],
  edges: []
};

const node: FullNode = {
  id: 'node-1',
  type: 'ai_model_node',
  position: { x: 100, y: 100 },
  data: {
    title: 'AI Model',
    description: 'Process data with AI',
    collection: 'compute',
    inputs: [],
    outputs: [],
    id: 'node-1',
    edges: []
  }
};
```

### 在后端使用

```typescript
// 1. 导入类型
import { 
  EssentialFlow, 
  EssentialNode,
  toEssential,
  validateEssentialFlow 
} from '@tradingflow/weather-linter';

// 2. 验证和存储
function saveFlow(fullFlow: FullFlow) {
  // 转换为 Essential 版本
  const essentialFlow = toEssential(fullFlow);
  
  // 验证
  const validation = validateEssentialFlow(essentialFlow);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // 存储到数据库
  await db.flows.create(essentialFlow);
}
```

---

## 🔄 转换函数

### Full -> Essential

```typescript
import { toEssential } from '@tradingflow/weather-linter';

const fullFlow: FullFlow = loadFromFrontend();
const essentialFlow = toEssential(fullFlow);

// essentialFlow 现在只包含核心字段
// 可以安全地存储到数据库
```

### Essential -> Full

```typescript
import { toFull } from '@tradingflow/weather-linter';

const essentialFlow: EssentialFlow = loadFromDatabase();
const fullFlow = toFull(essentialFlow);

// fullFlow 现在包含所有 UI 需要的字段
// 可以在前端渲染
```

---

## ✅ 验证函数

### 验证工作流完整性

```typescript
import { validateEssentialFlow } from '@tradingflow/weather-linter';

const result = validateEssentialFlow(flow);

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
  // ["Flow name is required", "Duplicate node id: node-1", ...]
}
```

### 验证 Handle 引用

```typescript
import { validateHandleReferences } from '@tradingflow/weather-linter';

const result = validateHandleReferences(flow);

if (!result.isValid) {
  console.error('Handle errors:', result.errors);
  // ["Edge 0: Source handle 'output1' not found in node ai_model_node_1"]
}
```

---

## 🎨 类型守卫

```typescript
import { isFullNode, isFullEdge, isFullFlow } from '@tradingflow/weather-linter';

function processNode(node: EssentialNode | FullNode) {
  if (isFullNode(node)) {
    // TypeScript 知道这是 FullNode
    console.log(node.width, node.height);
  } else {
    // 这是 EssentialNode
    console.log('Essential node');
  }
}
```

---

## 📝 字段对比

### 去除的字段（Full -> Essential）

**节点级别**:
- ❌ `className`
- ❌ `width`
- ❌ `height`
- ❌ `selected`
- ❌ `positionAbsolute`
- ❌ `dragging`

**data 级别**:
- ❌ `data.edges`（冗余）
- ❌ `data.menuItems`（UI）
- ❌ `data.isDeepEdit`（UI）
- ❌ `data.isFlowExecuting`（运行时）
- ❌ `data.isStopping`（运行时）
- ❌ `data.signals`（运行时）

**输入/输出级别**:
- ❌ `isDeleted`（UI）
- ❌ `disabled`（UI）
- ❌ `_instanceState`（运行时）
- ❌ `preload`（配置）

**边级别**:
- ❌ `type`（样式）
- ❌ `animated`（UI）

---

## 🚀 最佳实践

### 1. 类型导入

```typescript
// ✅ 推荐：从统一入口导入
import { FullFlow, EssentialFlow } from '@tradingflow/weather-linter';

// ❌ 避免：直接导入内部文件
import { FullFlow } from '@tradingflow/weather-linter/dist/types/weather';
```

### 2. 使用正确的版本

```typescript
// ✅ 前端使用 Full 版本
const flow: FullFlow = useFlowStore();

// ✅ 后端使用 Essential 版本
async function saveFlow(flow: EssentialFlow) {
  await database.save(flow);
}

// ✅ 转换时明确类型
const essentialFlow: EssentialFlow = toEssential(fullFlow);
```

### 3. 避免使用 any

```typescript
// ❌ 避免
const value: any = input.value;

// ✅ 使用正确的类型
const value: unknown = input.value;

// ✅ 或者更具体的类型
const value: string | number | object = input.value;
```

### 4. 类型守卫

```typescript
// ✅ 使用类型守卫
if (isFullNode(node)) {
  // TypeScript 自动推断类型
  const width = node.width;
}

// ❌ 避免类型断言
const width = (node as FullNode).width;
```

---

## 📊 文件大小对比

以包含 7 个节点、7 条边的工作流为例：

| 版本 | JSON 大小 | Gzip 压缩 | 节省 |
|------|----------|----------|------|
| Full | ~25 KB | ~8 KB | - |
| Essential | ~10 KB | ~4 KB | **60%** |

---

## 🔗 相关文档

- [Weather 语法（Full 版本）](../22_weather_docs/zh/core-concepts/weather-syntax.md)
- [Weather 语法对比](../22_weather_docs/zh/core-concepts/weather-syntax-comparison.md)
- [节点与工作流](../22_weather_docs/zh/core-concepts/nodes-and-workflows.md)

---

## ❓ FAQ

### Q: 什么时候使用 Full 版本？什么时候使用 Essential 版本？

**A:** 
- **Full 版本**: 前端渲染、用户交互、UI 状态管理
- **Essential 版本**: 数据库存储、API 传输、Agent 生成

### Q: 如何处理 `unknown` 类型的值？

**A:** 使用类型守卫或类型断言：
```typescript
const value: unknown = input.value;

// 方法 1: 类型守卫
if (typeof value === 'string') {
  console.log(value.toUpperCase());
}

// 方法 2: 类型断言（谨慎使用）
const stringValue = value as string;
```

### Q: 为什么不直接使用 `any`？

**A:** `any` 会关闭 TypeScript 的类型检查，失去类型安全。使用 `unknown` 强制你进行类型检查。

### Q: 如何扩展类型？

**A:** 使用接口扩展：
```typescript
// 扩展 FullNode
interface CustomFullNode extends FullNode {
  customField: string;
}

// 扩展 EssentialNodeData
interface CustomNodeData extends EssentialNodeData {
  customData: object;
}
```

---

**维护者**: TradingFlow Team  
**最后更新**: 2025-10-09
