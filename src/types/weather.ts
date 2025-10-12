/**
 * Weather 语法类型定义
 * 
 * 包含 Full 版本和 Essential 版本的完整类型定义
 * 
 * @see https://github.com/TradingFlow/docs/weather-syntax.md
 * @see https://github.com/TradingFlow/docs/weather-syntax-comparison.md
 */

// ============================================================================
// 通用基础类型
// ============================================================================

/**
 * 位置坐标
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 输入控件类型
 */
export type InputType =
  | 'text'
  | 'number'
  | 'paragraph'
  | 'select'
  | 'searchSelect'
  | 'button'
  | 'object'
  | 'paramMatrix';

/**
 * 数据类型
 */
export type DataType =
  | 'text'
  | 'number'
  | 'object'
  | 'array'
  | 'boolean'
  | 'paragraph';

/**
 * Handle 颜色（连接句柄颜色）
 */
export type HandleColor =
  | 'sky'      // 数据流类型（蓝色）
  | 'emerald'  // 交易类型（绿色）
  | 'amber'    // 配置类型（橙色）
  | 'rose';    // 输出类型（粉色）

/**
 * 节点分类
 */
export type NodeCollection =
  | 'input'    // 数据输入节点
  | 'compute'  // 计算处理节点
  | 'trade'    // 交易操作节点
  | 'core';    // 核心功能节点

/**
 * 节点类型
 */
export type NodeType =
  // Input Nodes
  | 'x_listener_node'
  | 'rss_listener_node'
  | 'binance_price_node'
  | 'dataset_input_node'
  // Compute Nodes
  | 'ai_model_node'
  | 'code_node'
  // Trade Nodes
  | 'buy_node'
  | 'sell_node'
  | 'swap_node'
  | 'vault_node'
  // Output Nodes
  | 'dataset_output_node'
  | 'telegram_sender_node';

/**
 * 边的类型（样式）
 */
export type EdgeType =
  | 'default'
  | 'step'
  | 'smoothstep'
  | 'straight';

// ============================================================================
// Handle 配置
// ============================================================================

/**
 * 连接句柄配置
 */
export interface HandleConfig {
  color: HandleColor;
  style?: Record<string, unknown>;
}

// ============================================================================
// Essential 版本类型 (核心版 - 用于存储和传输)
// ============================================================================

/**
 * Essential: 输入参数配置
 */
export interface EssentialInput {
  id: string;
  title: string;
  type: DataType;
  inputType: InputType;
  required: boolean;
  placeholder: string;
  handle: HandleConfig;
  value: unknown;  // 可以是任何类型的值
  options?: Array<string | { value: string; label: string; disabled?: boolean; tooltip?: string }>;
  min?: number;  // 用于数字类型验证
  max?: number;  // 用于数字类型验证
}

/**
 * Essential: 输出定义
 */
export interface EssentialOutput {
  id: string;
  title: string;
  type: DataType;
  handle: HandleConfig;
  description?: string;
}

/**
 * Essential: 节点数据
 */
export interface EssentialNodeData {
  title: string;
  description: string;
  collection: NodeCollection;
  inputs: EssentialInput[];
  outputs: EssentialOutput[];
}

/**
 * Essential: 节点定义
 */
export interface EssentialNode {
  position: Position;
  id: string;
  type: NodeType;
  data: EssentialNodeData;
}

/**
 * Essential: 边定义
 */
export interface EssentialEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

/**
 * Essential: 完整工作流
 */
export interface EssentialFlow {
  thumbnailUrl?: string;
  name: string;
  nodes: EssentialNode[];
  edges: EssentialEdge[];
}

// ============================================================================
// Full 版本类型 (完整版 - 用于前端展示)
// ============================================================================

/**
 * Full: 输入参数配置 (扩展版)
 */
export interface FullInput extends EssentialInput {
  isDeleted?: boolean;  // 删除标记
  disabled?: boolean;   // 禁用状态
  _actualValue?: unknown;  // 实际值（用于显示值与实际值不同的情况）
  _instanceState?: {
    hasLoaded?: boolean;
    error?: string;
    lastLoadTime?: number;
    cachedData?: unknown;
  };
  // 布局控制
  layout?: {
    group?: string;
    order?: number;
  };
  // 预加载配置
  preload?: {
    enabled: boolean;
    cacheDuration?: number;
    dependencies?: string[];
    loader: () => Promise<unknown>;
    processor?: (data: unknown) => Array<string | { value: string; label: string; disabled?: boolean; tooltip?: string }>;
    errorHandler?: (error: Error) => string;
    retry?: {
      times: number;
      delay: number;
    };
  };
}

/**
 * Full: 输出定义 (扩展版)
 */
export interface FullOutput extends EssentialOutput {
  isDeleted?: boolean;
}

/**
 * Full: 菜单项
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: unknown;  // React.ReactNode or any icon type
  danger?: boolean;
  onClick?: () => void;
}

/**
 * Full: Handle 信号数据
 */
export interface HandleSignal {
  handleId: string;
  handleType: 'input' | 'output';
  data: unknown;
  timestamp: string;
  fromNode?: string;
  toNode?: string;
}

/**
 * Full: 节点数据 (扩展版)
 */
export interface FullNodeData extends EssentialNodeData {
  inputs: FullInput[];
  outputs: FullOutput[];
  id: string;  // 冗余字段，与节点ID相同
  edges: FullEdge[];  // 节点相关的边（冗余，顶层已有）
  menuItems?: MenuItem[];  // 右键菜单项
  isDeepEdit?: boolean;  // 深度编辑模式
  isFlowExecuting?: boolean;  // 执行状态
  isStopping?: boolean;  // 停止状态
  signals?: HandleSignal[];  // 运行时信号数据
}

/**
 * Full: 节点定义 (扩展版)
 */
export interface FullNode extends EssentialNode {
  data: FullNodeData;
  className?: string;  // CSS 类名
  width?: number;  // 节点宽度
  height?: number;  // 节点高度
  selected?: boolean;  // 选中状态
  positionAbsolute?: Position;  // 绝对位置（计算值）
  dragging?: boolean;  // 拖拽状态
}

/**
 * Full: 边定义 (扩展版)
 */
export interface FullEdge extends EssentialEdge {
  type?: EdgeType;  // 边类型（样式）
  animated?: boolean;  // 动画效果
}

/**
 * Full: 完整工作流 (扩展版)
 */
export interface FullFlow extends EssentialFlow {
  nodes: FullNode[];
  edges: FullEdge[];
}

// ============================================================================
// 节点执行状态类型
// ============================================================================

/**
 * 节点执行状态
 */
export interface NodeExecutionState {
  status: 'idle' | 'pending' | 'running' | 'completed' | 'error' | 'stopped';
  progress?: number;  // 0-1
  message?: string;
  startTime?: number;
  endTime?: number;
  error?: Error;
}

/**
 * 节点执行状态映射
 */
export type NodeExecutionStates = Record<string, NodeExecutionState>;

/**
 * 节点信号映射
 */
export type NodeSignals = Record<string, HandleSignal>;

// ============================================================================
// 模块和连接类型
// ============================================================================

/**
 * 模块定义
 */
export interface Module {
  id: string;
  name: string;
  thumbnailUrl?: string;
  description?: string;
  nodes: EssentialNode[];
  edges: EssentialEdge[];
}

/**
 * Flow 连接
 */
export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// ============================================================================
// 转换函数类型
// ============================================================================

/**
 * Full 转 Essential 转换器
 */
export type ToEssentialConverter = (fullFlow: FullFlow) => EssentialFlow;

/**
 * Essential 转 Full 转换器
 */
export type ToFullConverter = (essentialFlow: EssentialFlow) => FullFlow;

// ============================================================================
// 工作流元数据
// ============================================================================

/**
 * 工作流元数据
 */
export interface FlowMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags?: string[];
  version?: number;
}

/**
 * 工作流统计
 */
export interface FlowStats {
  nodeCount: number;
  edgeCount: number;
  executionCount: number;
  lastExecutedAt?: string;
  averageExecutionTime?: number;
}

// ============================================================================
// 验证和校验类型
// ============================================================================

/**
 * 验证错误
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  path?: string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  // 基础类型已在上面定义
};

/**
 * 类型守卫：检查是否为 Full 版本节点
 */
export function isFullNode(node: EssentialNode | FullNode): node is FullNode {
  return 'width' in node || 'className' in node;
}

/**
 * 类型守卫：检查是否为 Full 版本边
 */
export function isFullEdge(edge: EssentialEdge | FullEdge): edge is FullEdge {
  return 'type' in edge || 'animated' in edge;
}

/**
 * 类型守卫：检查是否为 Full 版本工作流
 */
export function isFullFlow(flow: EssentialFlow | FullFlow): flow is FullFlow {
  return flow.nodes.length > 0 && isFullNode(flow.nodes[0]);
}
