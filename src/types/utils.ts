/**
 * Weather 工具函数
 * 
 * 提供序列化、清理、派生等实用函数
 */

import type {
  FullFlow,
  EssentialFlow,
  FullNode,
  FullEdge,
} from './weather';
import { toFull, toEssential } from './converters';

// ============================================================================
// 序列化和清理函数
// ============================================================================

/**
 * 序列化对象，移除不可序列化的属性
 * 
 * @param obj 要序列化的对象
 * @returns 清理后的对象
 */
export function sanitizeForSave(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSave(item));
  }

  // 处理对象
  const clean: Record<string, unknown> = {};

  // 需要保留的特殊字段
  const specialFields = ['_actualValue'];

  for (const [key, value] of Object.entries(obj)) {
    // 跳过 React 元素、函数和私有属性（但保留特殊字段）
    if (
      key === 'icon' ||
      key === 'onRunOnce' ||
      key === 'onDataChange' ||
      key === 'handleDeleteNode' ||
      key === 'onViewLogs' ||
      key === 'onRefreshSignals' ||
      key === 'onViewHandleSignals' ||
      (key.startsWith('_') && !specialFields.includes(key)) ||
      typeof value === 'function'
    ) {
      continue;
    }

    // 跳过 React 元素
    if (value && typeof value === 'object' && '$$typeof' in value) {
      continue;
    }

    clean[key] = sanitizeForSave(value);
  }

  return clean;
}

/**
 * 序列化 Flow 为可保存的格式
 * 
 * @param flow Full 版本的 Flow
 * @returns Essential 版本的 Flow（已清理）
 */
export function sanitizeFlow(flow: FullFlow): EssentialFlow {
  // 先转换为 Essential 版本
  const essential = toEssential(flow);
  
  // 再清理不可序列化的属性
  return sanitizeForSave(essential) as EssentialFlow;
}

// ============================================================================
// 派生函数 - Essential -> Full
// ============================================================================

/**
 * 从 Essential Flow 派生 Full Flow（前端展示用）
 * 
 * @param essentialFlow Essential 版本的 Flow
 * @param options 派生选项
 * @returns Full 版本的 Flow
 */
export function deriveFullFlow(
  essentialFlow: EssentialFlow,
  options?: {
    /** 是否在深度编辑模式 */
    isDeepEdit?: boolean;
    /** 是否正在执行 */
    isFlowExecuting?: boolean;
    /** 自定义节点宽度计算 */
    calculateNodeWidth?: (node: FullNode) => number;
    /** 自定义节点高度计算 */
    calculateNodeHeight?: (node: FullNode) => number;
  }
): FullFlow {
  // 使用基础转换函数
  const fullFlow = toFull(essentialFlow);

  // 应用自定义选项
  if (options) {
    fullFlow.nodes = fullFlow.nodes.map(node => {
      // 更新状态标志
      if (options.isDeepEdit !== undefined) {
        node.data.isDeepEdit = options.isDeepEdit;
      }
      if (options.isFlowExecuting !== undefined) {
        node.data.isFlowExecuting = options.isFlowExecuting;
      }

      // 应用自定义尺寸计算
      if (options.calculateNodeWidth) {
        node.width = options.calculateNodeWidth(node);
      }
      if (options.calculateNodeHeight) {
        node.height = options.calculateNodeHeight(node);
      }

      return node;
    });
  }

  return fullFlow;
}

/**
 * 从保存的数据恢复 Full Flow
 * 
 * @param savedData 保存的数据（可能是 Essential 或 Full 格式）
 * @returns Full 版本的 Flow
 */
export function restoreFullFlow(savedData: unknown): FullFlow {
  if (!savedData || typeof savedData !== 'object') {
    throw new Error('Invalid saved data');
  }

  const data = savedData as Record<string, unknown>;

  // 检查是否有必需字段
  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw new Error('Invalid flow data: missing nodes array');
  }
  if (!data.edges || !Array.isArray(data.edges)) {
    throw new Error('Invalid flow data: missing edges array');
  }

  // 判断是 Full 还是 Essential 版本
  const isFullVersion = data.nodes.length > 0 && 
    data.nodes.some((node: any) => 'width' in node || 'className' in node);

  if (isFullVersion) {
    // 已经是 Full 版本，直接返回（可能需要补充缺失字段）
    return data as unknown as FullFlow;
  } else {
    // 是 Essential 版本，需要转换
    return toFull(data as unknown as EssentialFlow);
  }
}

// ============================================================================
// 节点操作工具
// ============================================================================

/**
 * 为节点生成唯一 ID
 * 
 * @param nodeType 节点类型
 * @param existingIds 已存在的 ID 列表
 * @returns 唯一的节点 ID
 */
export function generateNodeId(
  nodeType: string,
  existingIds: string[] = []
): string {
  let index = 1;
  let id = `${nodeType}_${index}`;

  while (existingIds.includes(id)) {
    index++;
    id = `${nodeType}_${index}`;
  }

  return id;
}

/**
 * 为边生成唯一 ID
 * 
 * @param source 源节点 ID
 * @param sourceHandle 源句柄
 * @param target 目标节点 ID
 * @param targetHandle 目标句柄
 * @returns 边的 ID
 */
export function generateEdgeId(
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string
): string {
  return `edge_${source}_${sourceHandle}_to_${target}_${targetHandle}`;
}

/**
 * 简化的边 ID 生成（基于时间戳）
 * 
 * @returns 简短的边 ID
 */
export function generateSimpleEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// 数据克隆和比较
// ============================================================================

/**
 * 深度克隆对象（去除不可序列化的属性）
 * 
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(sanitizeForSave(obj)));
}

/**
 * 比较两个 Flow 是否相同（忽略 UI 状态）
 * 
 * @param flow1 第一个 Flow
 * @param flow2 第二个 Flow
 * @returns 是否相同
 */
export function compareFlows(
  flow1: FullFlow | EssentialFlow,
  flow2: FullFlow | EssentialFlow
): boolean {
  // 转换为 Essential 版本进行比较
  const essential1 = 'nodes' in flow1 && flow1.nodes.length > 0 && 'width' in flow1.nodes[0]
    ? toEssential(flow1 as FullFlow)
    : flow1;
  
  const essential2 = 'nodes' in flow2 && flow2.nodes.length > 0 && 'width' in flow2.nodes[0]
    ? toEssential(flow2 as FullFlow)
    : flow2;

  // 序列化后比较
  const str1 = JSON.stringify(sanitizeForSave(essential1));
  const str2 = JSON.stringify(sanitizeForSave(essential2));

  return str1 === str2;
}

// ============================================================================
// Handle 工具
// ============================================================================

/**
 * 为 Handle 生成完整的 ID（包含后缀）
 * 
 * @param handleId Handle 的基础 ID
 * @returns 带 -handle 后缀的完整 ID
 */
export function getHandleId(handleId: string): string {
  return handleId.endsWith('-handle') ? handleId : `${handleId}-handle`;
}

/**
 * 从完整的 Handle ID 中提取基础 ID
 * 
 * @param fullHandleId 完整的 Handle ID
 * @returns 基础 ID（去除 -handle 后缀）
 */
export function extractHandleId(fullHandleId: string): string {
  return fullHandleId.endsWith('-handle')
    ? fullHandleId.slice(0, -7)
    : fullHandleId;
}

// ============================================================================
// 类型判断工具
// ============================================================================

/**
 * 判断是否为有效的 Flow 对象
 * 
 * @param obj 要检查的对象
 * @returns 是否为有效的 Flow
 */
export function isValidFlow(obj: unknown): obj is FullFlow | EssentialFlow {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const data = obj as Record<string, unknown>;

  return (
    Array.isArray(data.nodes) &&
    Array.isArray(data.edges) &&
    typeof data.name === 'string'
  );
}

/**
 * 判断对象是否为空（null、undefined 或空对象）
 * 
 * @param obj 要检查的对象
 * @returns 是否为空
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }

  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.length === 0;
    }
    return Object.keys(obj).length === 0;
  }

  return false;
}

// ============================================================================
// 统计工具
// ============================================================================

/**
 * 计算 Flow 的统计信息
 * 
 * @param flow Flow 对象
 * @returns 统计信息
 */
export function calculateFlowStats(flow: FullFlow | EssentialFlow): {
  nodeCount: number;
  edgeCount: number;
  nodeTypes: Record<string, number>;
  isolatedNodes: number;
  averageConnections: number;
} {
  const nodes = flow.nodes;
  const edges = flow.edges;

  // 统计节点类型
  const nodeTypes: Record<string, number> = {};
  nodes.forEach(node => {
    nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
  });

  // 统计孤立节点
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  const isolatedNodes = nodes.length - connectedNodeIds.size;

  // 计算平均连接数
  const averageConnections = nodes.length > 0
    ? edges.length * 2 / nodes.length
    : 0;

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeTypes,
    isolatedNodes,
    averageConnections: Math.round(averageConnections * 100) / 100,
  };
}

// ============================================================================
// 导出所有函数
// ============================================================================

export default {
  sanitizeForSave,
  sanitizeFlow,
  deriveFullFlow,
  restoreFullFlow,
  generateNodeId,
  generateEdgeId,
  generateSimpleEdgeId,
  deepClone,
  compareFlows,
  getHandleId,
  extractHandleId,
  isValidFlow,
  isEmpty,
  calculateFlowStats,
};
