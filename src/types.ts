/**
 * TradingFlow Weather Linter - Type Definitions
 *
 * 导出所有 Weather 相关的类型定义
 *
 * 注：转换实现（converters）和工具函数（utils）已移至前端
 * linter 包仅提供类型定义
 */

// 导出完整的 Weather 类型系统
export * from "./types/weather";
// converters 和 utils 已废弃 - 转换逻辑应在前端实现

// ============================================================================
// 向后兼容的旧类型 (Deprecated - 使用 weather.ts 中的类型)
// ============================================================================

/**
 * @deprecated 使用 Position from './types/weather'
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * @deprecated 使用 EssentialInput from './types/weather'
 */
export interface NodeInput {
  id: string;
  value: unknown;
}

/**
 * @deprecated 使用 EssentialOutput from './types/weather'
 */
export interface NodeOutput {
  id: string;
  isDeleted: boolean;
}

/**
 * @deprecated 使用 EssentialNode from './types/weather'
 */
export interface Node {
  id: string;
  type: string;
  position: Position;
  title?: string;
  description?: string;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * @deprecated 使用 EssentialEdge from './types/weather'
 */
export interface Edge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  [key: string]: unknown;
}

/**
 * @deprecated 使用 EssentialFlow from './types/weather'
 */
export interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * @deprecated 使用 NodeType from './types/weather'
 */
export type NodeType =
  // Input Nodes
  | "price_node"
  | "dataset_input_node"
  | "x_listener_node"
  // Compute Nodes
  | "ai_model_node"
  | "code_node"
  // Trade Nodes
  | "swap_node"
  | "buy_node"
  | "sell_node"
  | "vault_node"
  // Output Nodes
  | "dataset_output_node"
  | "telegram_sender_node";

/**
 * @deprecated 创建新的节点定义接口在 weather.ts
 */
export interface NodeDefinition {
  type: NodeType;
  description: string;
  category: "input" | "compute" | "trade" | "output";
  requiredInputs: string[];
  optionalInputs: string[];
  outputs: string[];
}
