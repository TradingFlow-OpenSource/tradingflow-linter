/**
 * Weather 格式转换工具
 * 
 * 提供 Full 版本和 Essential 版本之间的转换函数
 */

import {
  FullFlow,
  EssentialFlow,
  FullNode,
  EssentialNode,
  FullEdge,
  EssentialEdge,
  FullInput,
  EssentialInput,
  FullOutput,
  EssentialOutput,
  FullNodeData,
  EssentialNodeData,
} from './weather';

// ============================================================================
// Input/Output 转换
// ============================================================================

/**
 * 清理 Input：Full -> Essential
 */
export function cleanInput(input: FullInput): EssentialInput {
  const essential: EssentialInput = {
    id: input.id,
    title: input.title,
    type: input.type,
    inputType: input.inputType,
    required: input.required,
    placeholder: input.placeholder,
    handle: input.handle,
    value: input.value,
  };

  // 可选字段
  if (input.options && input.options.length > 0) {
    essential.options = input.options;
  }
  if (input.min !== undefined) {
    essential.min = input.min;
  }
  if (input.max !== undefined) {
    essential.max = input.max;
  }

  return essential;
}

/**
 * 扩展 Input：Essential -> Full
 */
export function expandInput(input: EssentialInput): FullInput {
  return {
    ...input,
    isDeleted: false,
    disabled: false,
    _instanceState: {
      hasLoaded: false,
    },
  };
}

/**
 * 清理 Output：Full -> Essential
 */
export function cleanOutput(output: FullOutput): EssentialOutput {
  const essential: EssentialOutput = {
    id: output.id,
    title: output.title,
    type: output.type,
    handle: output.handle,
  };

  if (output.description) {
    essential.description = output.description;
  }

  return essential;
}

/**
 * 扩展 Output：Essential -> Full
 */
export function expandOutput(output: EssentialOutput): FullOutput {
  return {
    ...output,
    isDeleted: false,
  };
}

// ============================================================================
// NodeData 转换
// ============================================================================

/**
 * 清理 NodeData：Full -> Essential
 */
export function cleanNodeData(data: FullNodeData): EssentialNodeData {
  return {
    title: data.title,
    description: data.description,
    collection: data.collection,
    inputs: data.inputs.map(cleanInput),
    outputs: data.outputs.map(cleanOutput),
  };
}

/**
 * 扩展 NodeData：Essential -> Full
 */
export function expandNodeData(data: EssentialNodeData, nodeId: string): FullNodeData {
  return {
    ...data,
    inputs: data.inputs.map(expandInput),
    outputs: data.outputs.map(expandOutput),
    id: nodeId,
    edges: [],  // 将从顶层 edges 填充
    menuItems: getDefaultMenuItems(),
    isDeepEdit: false,
    isFlowExecuting: false,
    isStopping: false,
    signals: [],
  };
}

// ============================================================================
// Node 转换
// ============================================================================

/**
 * 清理 Node：Full -> Essential
 */
export function cleanNode(node: FullNode): EssentialNode {
  return {
    position: node.position,
    id: node.id,
    type: node.type,
    data: cleanNodeData(node.data),
  };
}

/**
 * 扩展 Node：Essential -> Full
 */
export function expandNode(node: EssentialNode): FullNode {
  return {
    ...node,
    data: expandNodeData(node.data, node.id),
    className: '',
    width: calculateNodeWidth(node),
    height: calculateNodeHeight(node),
    selected: false,
    dragging: false,
  };
}

// ============================================================================
// Edge 转换
// ============================================================================

/**
 * 清理 Edge：Full -> Essential
 */
export function cleanEdge(edge: FullEdge): EssentialEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  };
}

/**
 * 扩展 Edge：Essential -> Full
 */
export function expandEdge(edge: EssentialEdge): FullEdge {
  return {
    ...edge,
    type: 'default',
    animated: false,
  };
}

// ============================================================================
// Flow 转换
// ============================================================================

/**
 * Full -> Essential 转换
 * 
 * @param fullFlow Full 版本工作流
 * @returns Essential 版本工作流
 */
export function toEssential(fullFlow: FullFlow): EssentialFlow {
  return {
    thumbnailUrl: fullFlow.thumbnailUrl,
    name: fullFlow.name,
    nodes: fullFlow.nodes.map(cleanNode),
    edges: fullFlow.edges.map(cleanEdge),
  };
}

/**
 * Essential -> Full 转换
 * 
 * @param essentialFlow Essential 版本工作流
 * @returns Full 版本工作流
 */
export function toFull(essentialFlow: EssentialFlow): FullFlow {
  const fullNodes = essentialFlow.nodes.map(expandNode);
  const fullEdges = essentialFlow.edges.map(expandEdge);

  // 填充每个节点的 data.edges
  fullNodes.forEach(node => {
    node.data.edges = fullEdges.filter(
      edge => edge.source === node.id || edge.target === node.id
    );
  });

  return {
    thumbnailUrl: essentialFlow.thumbnailUrl,
    name: essentialFlow.name,
    nodes: fullNodes,
    edges: fullEdges,
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 计算节点宽度（简化版，实际应根据内容计算）
 */
function calculateNodeWidth(node: EssentialNode): number {
  const baseWidth = 300;
  const inputsWidth = node.data.inputs.length * 10;
  return Math.min(baseWidth + inputsWidth, 500);
}

/**
 * 计算节点高度（简化版，实际应根据内容计算）
 */
function calculateNodeHeight(node: EssentialNode): number {
  const baseHeight = 200;
  const inputsHeight = node.data.inputs.length * 40;
  const outputsHeight = node.data.outputs.length * 40;
  return baseHeight + inputsHeight + outputsHeight;
}

/**
 * 获取默认菜单项
 */
function getDefaultMenuItems() {
  return [
    { key: 'duplicate', label: 'Duplicate' },
    { key: 'delete', label: 'Delete', danger: true },
  ];
}

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证 Essential Flow
 */
export function validateEssentialFlow(flow: EssentialFlow): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证名称
  if (!flow.name || flow.name.trim().length === 0) {
    errors.push('Flow name is required');
  }

  // 验证节点
  if (!flow.nodes || flow.nodes.length === 0) {
    errors.push('Flow must contain at least one node');
  }

  // 验证节点 ID 唯一性
  const nodeIds = new Set<string>();
  flow.nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} is missing id`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }
  });

  // 验证边的引用
  flow.edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge at index ${index} references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge at index ${index} references non-existent target node: ${edge.target}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证 Handle 引用
 */
export function validateHandleReferences(flow: EssentialFlow): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 创建节点映射
  const nodeMap = new Map(flow.nodes.map(n => [n.id, n]));

  flow.edges.forEach((edge, index) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
      errors.push(`Edge ${index}: Source node ${edge.source} not found`);
      return;
    }

    if (!targetNode) {
      errors.push(`Edge ${index}: Target node ${edge.target} not found`);
      return;
    }

    // 验证 sourceHandle
    const sourceOutput = sourceNode.data.outputs.find(o => o.id === edge.sourceHandle);
    if (!sourceOutput) {
      errors.push(
        `Edge ${index}: Source handle '${edge.sourceHandle}' not found in node ${edge.source}`
      );
    }

    // 验证 targetHandle
    const targetInput = targetNode.data.inputs.find(i => i.id === edge.targetHandle);
    if (!targetInput) {
      errors.push(
        `Edge ${index}: Target handle '${edge.targetHandle}' not found in node ${edge.target}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
