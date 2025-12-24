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
  | "text"
  | "number"
  | "paragraph"
  | "select"
  | "searchSelect"
  | "codeInput"
  | "object"
  | "paramMatrix"
  | "boolean" // 布尔开关（True/False Toggle）
  | "switch" // Switch 切换器（Number/Percentage）
  | "percentage"; // 百分比滑块（0-100%）

/**
 * 数据类型
 * 包含所有前端 UI 控件支持的数据类型
 */
export type DataType =
  | "none"
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "object"
  | "paragraph"
  | "address"
  | "searchSelect"
  | "paramMatrix"
  | "radio"
  | "radioGroup"
  | "codeInput"
  | "array"
  | "boolean"
  | "wallet" // 钱包地址类型
  | "chain" // 区块链类型
  | "switch" // Switch 切换器
  | "percentage"; // 百分比（0-100%）

/**
 * Handle 颜色（连接句柄颜色）
 */
export type HandleColor =
  | "sky" // 数据流类型（蓝色）
  | "emerald" // 交易类型（绿色）
  | "amber" // 配置类型（橙色）
  | "rose"; // 输出类型（粉色）

/**
 * 节点分类
 */
export type NodeCollection =
  | "input" // 数据输入节点
  | "compute" // 计算处理节点
  | "trade" // 交易操作节点
  | "core"; // 核心功能节点

/**
 * 节点类型
 */
export type NodeType =
  // Input Nodes
  | "x_listener_node"
  | "price_node"
  | "dataset_input_node"
  | "gsheet_input_node"
  | "rootdata_node"
  // Compute Nodes
  | "ai_model_node"
  | "code_node"
  // Trade Nodes
  | "buy_node"
  | "sell_node"
  | "swap_node"
  | "vault_node"
  // Output Nodes
  | "dataset_output_node"
  | "gsheet_output_node"
  | "telegram_sender_node";

/**
 * 边的类型（样式）
 */
export type EdgeType = "default" | "step" | "smoothstep" | "straight";

// ============================================================================
// Switch 类型配置
// ============================================================================

/**
 * Switch 字段的值结构
 * 例如: { mode: "number", value: "100" } 或 { mode: "percentage", value: "50" }
 */
export interface SwitchValue {
  mode: string; // 当前选择的模式 ('number' | 'percentage' 等)
  value: string; // 具体的值（字符串形式）
}

/**
 * Switch 选项配置
 * 定义每个模式的配置
 */
export interface SwitchOption {
  value: string; // 模式标识 ('number' | 'percentage')
  label: string; // 显示标签
  inputType: InputType; // 该模式下的输入类型
  min?: number; // 最小值（用于 percentage 等）
  max?: number; // 最大值（用于 percentage 等）
  step?: number; // 步长（用于 percentage 滑块）
  suffix?: string; // 后缀（如 '%'）
}

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
 * 仅包含核心业务数据，不包含 UI 配置（handle, options）
 */
export interface EssentialInput {
  id: string;
  title: string;
  type: DataType;
  inputType: InputType;
  required?: boolean; // 可选，默认 false
  placeholder?: string; // 可选
  value?: unknown; // 可选，可以是任何类型的值（对于 switch 类型，值为 SwitchValue）
  min?: number; // 用于数字类型验证
  max?: number; // 用于数字类型验证
  skipUserValueRestore?: boolean; // Agent 标记：此值由 Agent 生成，不应保留为 "User Selected"
  switchOptions?: SwitchOption[]; // 用于 switch 类型的选项配置
  advanced?: boolean; // 标记为高级参数（配置层，通常从 nodeConfig 读取）
  isHidden?: boolean; // 当前是否隐藏（运行时状态，持久化保存用户选择）
}

/**
 * Essential: 输出定义
 * 仅包含核心业务数据，不包含 UI 配置（handle）
 */
export interface EssentialOutput {
  id: string;
  title: string;
  type: DataType;
  description?: string;
  isDeleted?: boolean; // 用户是否折叠/删除此输出（agent 生成、后端存储需要）
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
  version?: string; // 节点版本，默认为 'latest'
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
 * Full: 输入参数配置 (扩展版 - 添加 UI 配置)
 */
export interface FullInput extends EssentialInput {
  // UI 配置（从 nodeConfig 加载，不从 Essential 存储）
  handle: HandleConfig;
  options?: Array<
    | string
    | { value: string; label: string; disabled?: boolean; tooltip?: string }
  >;

  // Full 层扩展字段
  isDeleted?: boolean; // 删除标记
  disabled?: boolean; // 禁用状态
  _actualValue?: unknown; // 实际值（用于显示值与实际值不同的情况）
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
    processor?: (
      data: unknown
    ) => Array<
      | string
      | { value: string; label: string; disabled?: boolean; tooltip?: string }
    >;
    errorHandler?: (error: Error) => string;
    retry?: {
      times: number;
      delay: number;
    };
  };
}

/**
 * Full: 输出定义 (扩展版 - 添加 UI 配置)
 * 注：isDeleted 已在 EssentialOutput 中定义
 */
export interface FullOutput extends EssentialOutput {
  // UI 配置（从 nodeConfig 加载，不从 Essential 存储）
  handle: HandleConfig;
}

/**
 * Full: 菜单项
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: unknown; // React.ReactNode or any icon type
  danger?: boolean;
  onClick?: () => void;
}

/**
 * Full: Handle 信号数据
 */
export interface HandleSignal {
  handleId: string;
  handleType: "input" | "output";
  data: unknown;
  timestamp: string;
  fromNode?: string;
  toNode?: string;
}

/**
 * Full: 节点数据 (接口层 - 仅定义结构，无具体实现)
 * 注：Full 层仅作为 Essential 和 EditorFull 之间的接口桥梁
 */
export interface FullNodeData extends EssentialNodeData {
  inputs: FullInput[];
  outputs: FullOutput[];
  id: string; // 冗余字段，与节点ID相同
  edges: FullEdge[]; // 节点相关的边（冗余，顶层已有）
}

/**
 * Full: 节点定义 (接口层)
 */
export interface FullNode extends EssentialNode {
  data: FullNodeData;
}

/**
 * Full: 边定义 (接口层)
 */
export interface FullEdge extends EssentialEdge {
  type?: EdgeType; // 边类型（样式）
}

/**
 * Full: 完整工作流 (接口层)
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
  status: "idle" | "pending" | "running" | "completed" | "error" | "stopped";
  progress?: number; // 0-1
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
// EditorFull 版本类型 (编辑器扩展版 - 用于前端编辑器)
// ============================================================================

/**
 * EditorFull: 差异追踪辅助类型
 */
export interface EditorDiff<T = unknown> {
  oldValue: T;
  newValue: T;
  accepted?: boolean;
  preview?: boolean;
}

/**
 * EditorFull: 前端预加载配置
 * 用于编辑器的异步数据加载
 */
export interface EditorPreloadConfig {
  loader: () => Promise<unknown>;
  processor?: (data: unknown) => Array<
    | string
    | {
        value: string;
        label: string;
        disabled?: boolean;
        tooltip?: string;
        [key: string]: any;
      }
  >;
  errorHandler?: (error: unknown) => string;
  retry?: {
    times: number;
    delay: number;
  };
  cache?: {
    enabled: boolean;
    duration: number;
    key?: string;
  };
  dependencies?: string[];
  loadingText?: string;
  autoload?: boolean;
}

/**
 * EditorFull: 输入参数配置 (编辑器扩展版)
 * 在 FullInput 基础上添加编辑器特定功能
 */
export interface EditorFullInput extends Omit<FullInput, "preload"> {
  // 差异追踪字段
  titleDiff?: EditorDiff<string>;
  tooltipDiff?: EditorDiff<string>;
  typeDiff?: EditorDiff<DataType>;
  requiredDiff?: EditorDiff<boolean>;
  placeholderDiff?: EditorDiff<string>;
  valueDiff?: EditorDiff<unknown>;
  optionsDiff?: EditorDiff<
    Array<
      | string
      | { value: string; label: string; disabled?: boolean; tooltip?: string }
    >
  >;
  handleDiff?: EditorDiff<{ color?: string }>;

  // 编辑器特定字段
  tooltip?: string; // 提示文本
  className?: string; // CSS 类名
  chainRef?: string; // 关联的链选择输入的 ID

  // 使用前端的预加载配置
  preload?: EditorPreloadConfig;

  // 扩展实例状态 - 添加连接状态
  _instanceState?: {
    // FullInput 的预加载状态
    hasLoaded?: boolean;
    error?: string;
    lastLoadTime?: number;
    cachedData?: unknown;
    // 编辑器扩展：连接状态
    isConnected?: boolean;
    connectedHandles?: string[];
  };

  // 兼容旧代码的预加载状态
  _preloadState?: {
    isLoading?: boolean;
    hasLoaded?: boolean;
    error?: string;
    lastLoadTime?: number;
    cachedData?: unknown;
    lastDependencies?: any[]; // 上次 preload 时的 dependencies 值
  };
}

/**
 * EditorFull: 输出定义 (编辑器扩展版)
 */
export interface EditorFullOutput extends FullOutput {
  // 差异追踪字段
  titleDiff?: EditorDiff<string>;
  typeDiff?: EditorDiff<DataType>;
  handleDiff?: EditorDiff<{ color?: string }>;
}

/**
 * EditorFull: 节点数据 (编辑器扩展版 - 包含所有前端实现字段)
 */
export interface EditorFullNodeData
  extends Omit<FullNodeData, "inputs" | "outputs" | "collection" | "signals"> {
  inputs: EditorFullInput[];
  outputs: EditorFullOutput[];
  collection: string | null; // 编辑器中 collection 可以为 null
  signals?: unknown[]; // 编辑器使用自己的 NodeSignal 类型

  // 编辑器实现字段
  menuItems?: MenuItem[]; // 右键菜单项
  isDeepEdit?: boolean; // 深度编辑模式
  isFlowExecuting?: boolean; // 流程执行状态
  isStopping?: boolean; // 停止状态
  handleDeleteNode?: (nodeId: string) => void; // 删除节点回调
  onDataChange?: (nodeId: string, data: any) => void; // 数据变更回调
  onRunOnce?: () => void; // 单次运行回调
  isLocked?: boolean; // 锁定状态
  icon?: unknown; // React.ReactNode - 节点图标
  lintErrors?: any[]; // Lint 错误列表

  // 执行状态信息
  executionInfo?: {
    status: string; // 节点状态：idle, pending, running, completed, failed, skipped, terminated, etc.
    error?: string | null;
    timestamp?: string;
    metadata?: Record<string, unknown>;
    startTime?: string;
    endTime?: string;
    logs?: any[];
    lastCycle?: number;
    progress?: number;
    result?: unknown;
  };
}

/**
 * EditorFull: 节点 (编辑器扩展版 - 包含所有前端实现字段)
 */
export interface EditorFullNode extends Omit<FullNode, "data"> {
  data: EditorFullNodeData;
  // 前端实现字段
  className?: string; // CSS 类名
  width?: number; // 节点宽度
  height?: number; // 节点高度
  selected?: boolean; // 选中状态
  positionAbsolute?: Position; // 绝对位置（计算值）
  dragging?: boolean; // 拖拽状态
}

/**
 * EditorFull: 边 (编辑器扩展版 - 包含所有前端实现字段)
 */
export interface EditorFullEdge extends FullEdge {
  selected?: boolean; // 选中状态
  className?: string; // CSS 类名
  animated?: boolean; // 动画效果
}

/**
 * EditorFull: 工作流 (编辑器扩展版)
 */
export interface EditorFullFlow extends Omit<FullFlow, "nodes" | "edges"> {
  nodes: EditorFullNode[];
  edges: EditorFullEdge[];
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
  severity: "error" | "warning";
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

export // 基础类型已在上面定义
 type {};

/**
 * 类型守卫：检查是否为 Full 版本节点
 */
export function isFullNode(node: EssentialNode | FullNode): node is FullNode {
  return "width" in node || "className" in node;
}

/**
 * 类型守卫：检查是否为 Full 版本边
 */
export function isFullEdge(edge: EssentialEdge | FullEdge): edge is FullEdge {
  return "type" in edge || "animated" in edge;
}

/**
 * 类型守卫：检查是否为 Full 版本工作流
 */
export function isFullFlow(flow: EssentialFlow | FullFlow): flow is FullFlow {
  return flow.nodes.length > 0 && isFullNode(flow.nodes[0]);
}
