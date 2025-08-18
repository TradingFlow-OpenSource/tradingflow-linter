export * from './types';
import { FlowData, Node, Edge, NodeType, NodeDefinition, Position } from './types';

export interface LintOptions {
  strict?: boolean;
  mode?: 'flow' | 'node'; // 执行模式：flow = 完整流程校验，node = 单节点校验
}

export type LintSeverity = "error" | "warning";

export interface LintIssue {
  severity: LintSeverity;
  message: string;
  elementId?: string;
  elementType?: "node" | "edge";
  code: string;
}

// TFL 节点定义
const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  // Input Nodes
  'binance_price_node': {
    type: 'binance_price_node',
    description: 'Get Binance market data for specified trading pairs',
    category: 'input',
    requiredInputs: ['symbol', 'interval'],
    optionalInputs: ['limit'],
    outputs: ['current_price', 'kline_data']
  },
  'dataset_input_node': {
    type: 'dataset_input_node',
    description: 'Load dataset from user\'s Google Sheets',
    category: 'input',
    requiredInputs: ['doc_link'],
    optionalInputs: [],
    outputs: ['data']
  },
  'rss_listener_node': {
    type: 'rss_listener_node',
    description: 'Get information from RSS feeds',
    category: 'input',
    requiredInputs: ['route'],
    optionalInputs: ['parameters', 'keywords'],
    outputs: ['feeds']
  },
  'x_listener_node': {
    type: 'x_listener_node',
    description: 'Monitor X (formerly Twitter) accounts',
    category: 'input',
    requiredInputs: ['accounts'],
    optionalInputs: ['keywords'],
    outputs: ['latest tweets']
  },

  // Compute Nodes
  'ai_model_node': {
    type: 'ai_model_node',
    description: 'Run AI models for analysis and generation',
    category: 'compute',
    requiredInputs: ['model', 'prompt'],
    optionalInputs: ['parameters'],
    outputs: ['ai_response']
  },
  'code_node': {
    type: 'code_node',
    description: 'Execute custom Python code',
    category: 'compute',
    requiredInputs: ['python_code'],
    optionalInputs: ['input_data'],
    outputs: ['output_data', 'debug_output']
  },

  // Trade Nodes
  'swap_node': {
    type: 'swap_node',
    description: 'Process swap operations and execute swaps',
    category: 'trade',
    requiredInputs: ['from_token', 'to_token', 'chain', 'vault_address'],
    optionalInputs: ['amount_in_percentage', 'amount_in_human_readble', 'slippery'],
    outputs: ['trade_receipt']
  },
  'buy_node': {
    type: 'buy_node',
    description: 'Process buy signals and execute buy operations',
    category: 'trade',
    requiredInputs: ['buy_token', 'base_token', 'vault_address', 'chain'],
    optionalInputs: ['order_type', 'limited_price', 'amount_in_percentage', 'amount_in_human_readble'],
    outputs: ['trade_receipt']
  },
  'sell_node': {
    type: 'sell_node',
    description: 'Process sell signals and execute sell operations',
    category: 'trade',
    requiredInputs: ['sell_token', 'base_token', 'vault_address', 'chain'],
    optionalInputs: ['order_type', 'limited_price', 'amount_in_percentage', 'amount_in_human_readble'],
    outputs: ['trade_receipt']
  },
  'vault_node': {
    type: 'vault_node',
    description: 'Display user\'s vault information',
    category: 'trade',
    requiredInputs: ['vault_address', 'chain'],
    optionalInputs: [],
    outputs: ['vault_balance', 'vault_address', 'chain']
  },

  // Output Nodes
  'dataset_output_node': {
    type: 'dataset_output_node',
    description: 'Save data to user\'s Google Sheets',
    category: 'output',
    requiredInputs: ['doc_link', 'data'],
    optionalInputs: [],
    outputs: []
  },
  'telegram_sender_node': {
    type: 'telegram_sender_node',
    description: 'Send messages to Telegram',
    category: 'output',
    requiredInputs: ['account_to_send', 'messages'],
    optionalInputs: [],
    outputs: []
  }
};

export class TFLLint {
  private options: LintOptions;

  constructor(options: LintOptions = {}) {
    this.options = options;
  }

  /**
   * 检查流程图数据的有效性
   */
  lintFlow(data: FlowData): LintIssue[] {
    const issues: LintIssue[] = [];

    // 验证基本结构
    if (!data) {
      issues.push({
        severity: "error",
        message: "Flow data is null or undefined",
        code: "invalid-flow-data"
      });
      return issues;
    }

    if (!Array.isArray(data.nodes)) {
      issues.push({
        severity: "error",
        message: "Flow data must have a nodes array",
        code: "missing-nodes-array"
      });
      return issues;
    }

    if (!Array.isArray(data.edges)) {
      issues.push({
        severity: "error",
        message: "Flow data must have an edges array",
        code: "missing-edges-array"
      });
      return issues;
    }

    // 检查节点
    issues.push(...this.lintNodes(data.nodes));

    // 检查边 - 在 node 模式下跳过边有效性检查
    if (this.options?.mode !== 'node') {
      issues.push(...this.lintEdges(data.edges, data.nodes));
    }

    // 检查流程完整性 - 在 node 模式下跳过流程完整性检查
    if (this.options?.mode !== 'node') {
      issues.push(...this.lintFlowIntegrity(data));
    }

    return issues;
  }

  /**
   * 检查节点
   */
  private lintNodes(nodes: Node[]): LintIssue[] {
    const issues: LintIssue[] = [];
    const nodeIds = new Set<string>();

    nodes.forEach((node, index) => {
      // 检查必需字段
      if (!node.id) {
        issues.push({
          severity: "error",
          message: `Node at index ${index} is missing required field: id`,
          elementType: "node",
          code: "missing-node-id"
        });
        return;
      }

      // 检查 ID 唯一性
      if (nodeIds.has(node.id)) {
        issues.push({
          severity: "error",
          message: `Duplicate node ID: ${node.id}`,
          elementId: node.id,
          elementType: "node",
          code: "duplicate-node-id"
        });
      }
      nodeIds.add(node.id);

      // 检查节点类型
      if (!node.type) {
        issues.push({
          severity: "error",
          message: "Node is missing required field: type",
          elementId: node.id,
          elementType: "node",
          code: "missing-node-type"
        });
      } else if (!NODE_DEFINITIONS[node.type as NodeType]) {
        issues.push({
          severity: "error",
          message: `Unknown node type: ${node.type}`,
          elementId: node.id,
          elementType: "node",
          code: "invalid-node-type"
        });
      }

      // 检查位置
      if (!node.position) {
        issues.push({
          severity: "error",
          message: "Node is missing required field: position",
          elementId: node.id,
          elementType: "node",
          code: "missing-node-position"
        });
      } else {
        if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          issues.push({
            severity: "error",
            message: "Node position must have numeric x and y coordinates",
            elementId: node.id,
            elementType: "node",
            code: "invalid-node-position"
          });
        }
      }

      // 检查节点特定的输入输出
      if (node.type && NODE_DEFINITIONS[node.type as NodeType]) {
        issues.push(...this.lintNodeInputsOutputs(node, NODE_DEFINITIONS[node.type as NodeType]));
      }

      // 检查位置重叠 - 在 node 模式下跳过位置重叠检查
      if (node.position && this.options?.mode !== 'node') {
        nodes.forEach((otherNode) => {
          if (
            node.id !== otherNode.id &&
            otherNode.position &&
            this.checkPositionOverlap(node.position, otherNode.position)
          ) {
            issues.push({
              severity: "warning",
              message: `Node overlaps with node ${otherNode.id}`,
              elementId: node.id,
              elementType: "node",
              code: "node-position-overlap"
            });
          }
        });
      }
    });

    return issues;
  }

  /**
   * 检查节点的输入输出
   */
  private lintNodeInputsOutputs(node: Node, definition: NodeDefinition): LintIssue[] {
    const issues: LintIssue[] = [];

    // 检查必需输入
    const nodeInputIds = (node.inputs || []).map(input => input.id);
    definition.requiredInputs.forEach(requiredInput => {
      if (!nodeInputIds.includes(requiredInput)) {
        issues.push({
          severity: "error",
          message: `Node ${node.id} is missing required input: ${requiredInput}`,
          elementId: node.id,
          elementType: "node",
          code: "missing-required-input"
        });
      }
    });

    // 检查输入格式
    if (node.inputs) {
      node.inputs.forEach((input, index) => {
        if (!input.id) {
          issues.push({
            severity: "error",
            message: `Node ${node.id} input at index ${index} is missing id`,
            elementId: node.id,
            elementType: "node",
            code: "missing-input-id"
          });
        }

        // 检查是否是有效的输入
        const allValidInputs = [...definition.requiredInputs, ...definition.optionalInputs];
        if (input.id && !allValidInputs.includes(input.id)) {
          issues.push({
            severity: "warning",
            message: `Node ${node.id} has unknown input: ${input.id}`,
            elementId: node.id,
            elementType: "node",
            code: "unknown-input"
          });
        }
      });
    }

    // 检查输出格式
    if (node.outputs) {
      node.outputs.forEach((output, index) => {
        if (!output.id) {
          issues.push({
            severity: "error",
            message: `Node ${node.id} output at index ${index} is missing id`,
            elementId: node.id,
            elementType: "node",
            code: "missing-output-id"
          });
        }

        if (typeof output.isDeleted !== 'boolean') {
          issues.push({
            severity: "error",
            message: `Node ${node.id} output ${output.id} must have boolean isDeleted field`,
            elementId: node.id,
            elementType: "node",
            code: "invalid-output-isdeleted"
          });
        }

        // 检查是否是有效的输出
        if (output.id && !definition.outputs.includes(output.id)) {
          issues.push({
            severity: "warning",
            message: `Node ${node.id} has unknown output: ${output.id}`,
            elementId: node.id,
            elementType: "node",
            code: "unknown-output"
          });
        }
      });
    }

    return issues;
  }

  /**
   * 检查边
   */
  private lintEdges(edges: Edge[], nodes: Node[]): LintIssue[] {
    const issues: LintIssue[] = [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    edges.forEach((edge, index) => {
      // 检查必需字段
      if (!edge.source) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: source`,
          elementType: "edge",
          code: "missing-edge-source"
        });
      }

      if (!edge.sourceHandle) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: sourceHandle`,
          elementType: "edge",
          code: "missing-edge-sourcehandle"
        });
      }

      if (!edge.target) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: target`,
          elementType: "edge",
          code: "missing-edge-target"
        });
      }

      if (!edge.targetHandle) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: targetHandle`,
          elementType: "edge",
          code: "missing-edge-targethandle"
        });
      }

      // 检查源节点存在性
      if (edge.source && !nodeMap.has(edge.source)) {
        issues.push({
          severity: "error",
          message: `Edge references non-existent source node: ${edge.source}`,
          elementType: "edge",
          code: "invalid-edge-source-node"
        });
      }

      // 检查目标节点存在性
      if (edge.target && !nodeMap.has(edge.target)) {
        issues.push({
          severity: "error",
          message: `Edge references non-existent target node: ${edge.target}`,
          elementType: "edge",
          code: "invalid-edge-target-node"
        });
      }

      // 检查源输出端口存在性
      if (edge.source && edge.sourceHandle && nodeMap.has(edge.source)) {
        const sourceNode = nodeMap.get(edge.source)!;
        const sourceOutputs = (sourceNode.outputs || []).map(output => output.id);
        // Strip -handle suffix for validation (frontend uses field_name-handle format)
        const handleToCheck = edge.sourceHandle.endsWith('-handle')
          ? edge.sourceHandle.slice(0, -7)
          : edge.sourceHandle;
        if (!sourceOutputs.includes(handleToCheck)) {
          issues.push({
            severity: "error",
            message: `Edge references non-existent output handle ${edge.sourceHandle} on node ${edge.source}`,
            elementType: "edge",
            code: "invalid-edge-source-handle"
          });
        }
      }

      // 检查目标输入端口存在性
      if (edge.target && edge.targetHandle && nodeMap.has(edge.target)) {
        const targetNode = nodeMap.get(edge.target)!;
        const targetInputs = (targetNode.inputs || []).map(input => input.id);
        // Strip -handle suffix for validation (frontend uses field_name-handle format)
        const handleToCheck = edge.targetHandle.endsWith('-handle')
          ? edge.targetHandle.slice(0, -7)
          : edge.targetHandle;
        if (!targetInputs.includes(handleToCheck)) {
          issues.push({
            severity: "error",
            message: `Edge references non-existent input handle ${edge.targetHandle} on node ${edge.target}`,
            elementType: "edge",
            code: "invalid-edge-target-handle"
          });
        }
      }
    });

    return issues;
  }

  /**
   * 检查流程完整性
   */
  private lintFlowIntegrity(data: FlowData): LintIssue[] {
    const issues: LintIssue[] = [];

    // 检查是否有孤立节点（没有连接的节点）
    const connectedNodes = new Set<string>();
    data.edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    data.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && data.nodes.length > 1) {
        issues.push({
          severity: "warning",
          message: `Node ${node.id} is isolated (not connected to any other nodes)`,
          elementId: node.id,
          elementType: "node",
          code: "isolated-node"
        });
      }
    });

    // 检查循环依赖
    issues.push(...this.detectCycles(data));

    return issues;
  }

  /**
   * 检测循环依赖
   */
  private detectCycles(data: FlowData): LintIssue[] {
    const issues: LintIssue[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        // 找到循环
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat(nodeId);
        issues.push({
          severity: "error",
          message: `Circular dependency detected: ${cycle.join(' -> ')}`,
          code: "circular-dependency"
        });
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // 查找所有从当前节点出发的边
      const outgoingEdges = data.edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (dfs(edge.target, [...path, nodeId])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // 对每个节点进行 DFS
    data.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return issues;
  }

  /**
   * 检查两个位置是否重叠（简化版本，假设节点大小为 100x50）
   */
  private checkPositionOverlap(pos1: Position, pos2: Position): boolean {
    const NODE_WIDTH = 100;
    const NODE_HEIGHT = 50;

    return (
      pos1.x < pos2.x + NODE_WIDTH &&
      pos1.x + NODE_WIDTH > pos2.x &&
      pos1.y < pos2.y + NODE_HEIGHT &&
      pos1.y + NODE_HEIGHT > pos2.y
    );
  }

  /**
   * 获取节点定义
   */
  getNodeDefinition(nodeType: NodeType): NodeDefinition | undefined {
    return NODE_DEFINITIONS[nodeType];
  }

  /**
   * 获取所有支持的节点类型
   */
  getSupportedNodeTypes(): NodeType[] {
    return Object.keys(NODE_DEFINITIONS) as NodeType[];
  }
}

/**
 * 便捷函数：使用默认选项进行 linting
 */
export function lintFlow(data: FlowData, options?: LintOptions): LintIssue[] {
  const linter = new TFLLint(options);
  return linter.lintFlow(data);
}

/**
 * 便捷函数：专门用于单节点执行的 linting
 */
export function lintNodeExecution(data: FlowData, options?: Omit<LintOptions, 'mode'>): LintIssue[] {
  const linter = new TFLLint({ ...options, mode: 'node' });
  return linter.lintFlow(data);
}
