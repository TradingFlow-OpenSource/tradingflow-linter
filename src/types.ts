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

// NodeType 已从 weather.ts 导出，不再在此重复定义
// 使用: import { NodeType } from './types/weather'
