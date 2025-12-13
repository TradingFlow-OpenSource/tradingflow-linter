export * from "./types";
import {
  EssentialNode,
  EssentialEdge,
  EssentialFlow,
  NodeType,
  Position,
  EssentialInput,
  EssentialOutput,
} from "./types/weather";

// Linter 专用类型
export interface NodeDefinition {
  type: NodeType;
  description: string;
  category: "input" | "compute" | "trade" | "output";
  requiredInputs: string[];
  optionalInputs: string[];
  outputs: string[];
}

export interface FlowData {
  nodes: EssentialNode[];
  edges: EssentialEdge[];
}

export interface LintOptions {
  strict?: boolean;
  mode?: "flow" | "node"; // 执行模式：flow = 完整流程校验，node = 单节点校验
}

export type LintSeverity = "error" | "warning";

export interface LintIssue {
  severity: LintSeverity;
  message: string;
  elementId?: string;
  elementType?: "node" | "edge";
  code: string;
  fieldId?: string; // 字段级别错误：指示具体是哪个输入或输出字段
  fieldType?: "input" | "output"; // 字段类型
}

// TFL 节点定义
const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  // Input Nodes
  price_node: {
    type: "price_node",
    description: "Get cryptocurrency price data from CoinGecko",
    category: "input",
    requiredInputs: ["source", "data_type", "symbol"],
    optionalInputs: [],
    outputs: ["data"],
  },
  dataset_input_node: {
    type: "dataset_input_node",
    description: "Load dataset from user's Google Sheets",
    category: "input",
    requiredInputs: ["doc_link"],
    optionalInputs: [],
    outputs: ["data"],
  },
  x_listener_node: {
    type: "x_listener_node",
    description: "Monitor X (formerly Twitter) accounts",
    category: "input",
    requiredInputs: ["accounts"],
    optionalInputs: ["keywords"],
    outputs: ["latest_tweets"],
  },
  rootdata_node: {
    type: "rootdata_node",
    description: "Query RootData API for projects/VC/people and related lists",
    category: "input",
    requiredInputs: ["operation"],
    optionalInputs: [
      "language",
      "query",
      "precise_x_search",
      "type",
      "project_id",
      "contract_address",
      "org_id",
      "people_id",
      "include_team",
      "include_investors",
      "include_investments",
      "page",
      "page_size",
      "begin_time",
      "end_time",
      "min_amount",
      "max_amount",
      "days",
      "rank_type",
      "heat",
      "influence",
      "followers",
      "recent_joinees",
      "recent_resignations",
      "ecosystem_ids",
      "tag_ids",
    ],
    outputs: ["data"],
  },

  // Compute Nodes
  ai_model_node: {
    type: "ai_model_node",
    description: "Run AI models for analysis and generation",
    category: "compute",
    requiredInputs: ["model", "prompt"],
    optionalInputs: ["parameters"],
    outputs: ["ai_response"],
  },
  code_node: {
    type: "code_node",
    description: "Execute custom Python code",
    category: "compute",
    requiredInputs: ["python_code"],
    optionalInputs: ["input_data"],
    outputs: ["output_data"], // 🔥 修复：debug_output 已移除
  },

  // Trade Nodes
  swap_node: {
    type: "swap_node",
    description: "Process swap operations and execute swaps",
    category: "trade",
    // 🔧 FIX: 更新为新的节点结构 - 移除 chain 和 vault_address，改为 vault 和 amount_in_human_readable
    requiredInputs: [
      "from_token",
      "to_token",
      "amount_in_human_readable",
      "slippery",
      "vault",
    ],
    optionalInputs: ["amount_in_percentage", "amount_in_human_readble"],
    outputs: ["trade_receipt"],
  },
  buy_node: {
    type: "buy_node",
    description: "Process buy signals and execute buy operations",
    category: "trade",
    // 🔧 FIX: 更新为新的节点结构 - 移除 chain 和 vault_address，改为 vault 和 amount_in_human_readable
    requiredInputs: [
      "buy_token",
      "base_token",
      "amount_in_human_readable",
      "vault",
    ],
    optionalInputs: [
      "order_type",
      "limited_price",
      "amount_in_percentage",
      "amount_in_human_readble",
    ],
    outputs: ["trade_receipt"],
  },
  sell_node: {
    type: "sell_node",
    description: "Process sell signals and execute sell operations",
    category: "trade",
    // 🔧 FIX: 更新为新的节点结构 - 移除 chain 和 vault_address，改为 vault 和 amount_in_human_readable
    requiredInputs: [
      "sell_token",
      "base_token",
      "amount_in_human_readable",
      "vault",
    ],
    optionalInputs: [
      "order_type",
      "limited_price",
      "amount_in_percentage",
      "amount_in_human_readble",
    ],
    outputs: ["trade_receipt"],
  },
  vault_node: {
    type: "vault_node",
    description: "Display user's vault information",
    category: "trade",
    requiredInputs: ["vault_address", "chain"],
    optionalInputs: [],
    outputs: ["vault"], // 🔥 修复：统一为单一 vault 输出
  },

  // Output Nodes
  dataset_output_node: {
    type: "dataset_output_node",
    description: "Save data to user's Google Sheets",
    category: "output",
    requiredInputs: ["doc_link", "data"],
    optionalInputs: [],
    outputs: [],
  },
  telegram_sender_node: {
    type: "telegram_sender_node",
    description: "Send messages to Telegram",
    category: "output",
    requiredInputs: ["account_to_send", "messages"],
    optionalInputs: [],
    outputs: ["result"], // 🔥 统一为单一 result 输出
  },
};

export class TFLLint {
  private options?: LintOptions;
  private edges: EssentialEdge[] = [];

  constructor(options?: LintOptions) {
    this.options = options;
  }

  /**
   * 检查流程图数据的有效性
   */
  lintFlow(data: FlowData): LintIssue[] {
    const issues: LintIssue[] = [];

    // 保存 edges 引用供其他方法使用
    this.edges = data.edges || [];

    // 检查基本结构
    if (!data.nodes || !Array.isArray(data.nodes)) {
      issues.push({
        severity: "error",
        message: "Flow data is null or undefined",
        code: "invalid-flow-data",
      });
      return issues;
    }

    if (!Array.isArray(data.nodes)) {
      issues.push({
        severity: "error",
        message: "Flow data must have a nodes array",
        code: "missing-nodes-array",
      });
      return issues;
    }

    if (!Array.isArray(data.edges)) {
      issues.push({
        severity: "error",
        message: "Flow data must have an edges array",
        code: "missing-edges-array",
      });
      return issues;
    }

    // 检查节点
    issues.push(...this.lintNodes(data.nodes));

    // 检查边 - 在 node 模式下跳过边有效性检查
    if (this.options?.mode !== "node") {
      issues.push(...this.lintEdges(data.edges, data.nodes));
    }

    // 检查流程完整性 - 在 node 模式下跳过流程完整性检查
    if (this.options?.mode !== "node") {
      issues.push(...this.lintFlowIntegrity(data));
    }

    return issues;
  }

  /**
   * 检查节点
   */
  private lintNodes(nodes: EssentialNode[]): LintIssue[] {
    const issues: LintIssue[] = [];
    const nodeIds = new Set<string>();

    nodes.forEach((node, index) => {
      // 检查必需字段
      if (!node.id) {
        issues.push({
          severity: "error",
          message: `Node at index ${index} is missing required field: id`,
          elementType: "node",
          code: "missing-node-id",
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
          code: "duplicate-node-id",
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
          code: "missing-node-type",
        });
      } else if (!NODE_DEFINITIONS[node.type as NodeType]) {
        issues.push({
          severity: "error",
          message: `Unknown node type: ${node.type}`,
          elementId: node.id,
          elementType: "node",
          code: "invalid-node-type",
        });
      }

      // 检查位置
      if (!node.position) {
        issues.push({
          severity: "error",
          message: "Node is missing required field: position",
          elementId: node.id,
          elementType: "node",
          code: "missing-node-position",
        });
      } else {
        if (
          typeof node.position.x !== "number" ||
          typeof node.position.y !== "number"
        ) {
          issues.push({
            severity: "error",
            message: "Node position must have numeric x and y coordinates",
            elementId: node.id,
            elementType: "node",
            code: "invalid-node-position",
          });
        }
      }

      // 检查节点特定的输入输出
      if (node.type && NODE_DEFINITIONS[node.type as NodeType]) {
        issues.push(
          ...this.lintNodeInputsOutputs(
            node,
            NODE_DEFINITIONS[node.type as NodeType]
          )
        );
      }

      // 检查节点版本
      issues.push(...this.lintNodeVersion(node));

      // 检查位置重叠 - 在 node 模式下跳过位置重叠检查
      if (node.position && this.options?.mode !== "node") {
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
              code: "node-position-overlap",
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
  private lintNodeInputsOutputs(
    node: EssentialNode,
    definition: NodeDefinition
  ): LintIssue[] {
    const issues: LintIssue[] = [];

    // 检查必需输入
    const nodeInputsMap = new Map(
      (node.data.inputs || []).map((input) => [input.id, input])
    );
    definition.requiredInputs.forEach((requiredInput) => {
      const input = nodeInputsMap.get(requiredInput);

      if (!input) {
        // 字段不存在
        issues.push({
          severity: "error",
          message: `Missing required input: ${requiredInput}`,
          elementId: node.id,
          elementType: "node",
          code: "missing-required-input",
          fieldId: requiredInput,
          fieldType: "input",
        });
      } else {
        // 🔧 FIX: 正确的逻辑 - 必要字段只要被连接或有值（包括空字符串）就OK
        const isConnected = this.isInputConnected(node.id, requiredInput);
        const hasValue = input.value !== undefined && input.value !== null;

        // 只有当既没有值（undefined/null），也没有被连线时才报错
        if (!hasValue && !isConnected) {
          issues.push({
            severity: "error",
            message: `Required input "${requiredInput}" has no value and is not connected`,
            elementId: node.id,
            elementType: "node",
            code: "required-input-empty",
            fieldId: requiredInput,
            fieldType: "input",
          });
        }
      }
    });

    // 检查输入格式
    if (node.data.inputs) {
      node.data.inputs.forEach((input, index) => {
        if (!input.id) {
          issues.push({
            severity: "error",
            message: `Node ${node.id} input at index ${index} is missing id`,
            elementId: node.id,
            elementType: "node",
            code: "missing-input-id",
          });
        }

        // 检查是否是有效的输入
        const allValidInputs = [
          ...definition.requiredInputs,
          ...definition.optionalInputs,
        ];
        if (input.id && !allValidInputs.includes(input.id)) {
          issues.push({
            severity: "warning",
            message: `Node ${node.id} has unknown input: ${input.id}`,
            elementId: node.id,
            elementType: "node",
            code: "unknown-input",
          });
        }
      });
    }

    // 检查输出格式
    if (node.data.outputs) {
      node.data.outputs.forEach((output, index) => {
        if (!output.id) {
          issues.push({
            severity: "error",
            message: `Node ${node.id} output at index ${index} is missing id`,
            elementId: node.id,
            elementType: "node",
            code: "missing-output-id",
          });
        }

        // isDeleted 是可选字段
        if (
          output.isDeleted !== undefined &&
          typeof output.isDeleted !== "boolean"
        ) {
          issues.push({
            severity: "error",
            message: `Node ${node.id} output ${output.id} must have boolean isDeleted field`,
            elementId: node.id,
            elementType: "node",
            code: "invalid-output-isdeleted",
          });
        }

        // 检查是否是有效的输出
        if (output.id && !definition.outputs.includes(output.id)) {
          issues.push({
            severity: "warning",
            message: `Node ${node.id} has unknown output: ${output.id}`,
            elementId: node.id,
            elementType: "node",
            code: "unknown-output",
          });
        }
      });
    }

    return issues;
  }

  /**
   * 检查边
   */
  private lintEdges(
    edges: EssentialEdge[],
    nodes: EssentialNode[]
  ): LintIssue[] {
    const issues: LintIssue[] = [];
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    edges.forEach((edge, index) => {
      // 检查必需字段
      if (!edge.source) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: source`,
          elementType: "edge",
          code: "missing-edge-source",
        });
      }

      if (!edge.sourceHandle) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: sourceHandle`,
          elementType: "edge",
          code: "missing-edge-sourcehandle",
        });
      }

      if (!edge.target) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: target`,
          elementType: "edge",
          code: "missing-edge-target",
        });
      }

      if (!edge.targetHandle) {
        issues.push({
          severity: "error",
          message: `Edge at index ${index} is missing required field: targetHandle`,
          elementType: "edge",
          code: "missing-edge-targethandle",
        });
      }

      // 检查源节点存在性
      if (edge.source && !nodeMap.has(edge.source)) {
        issues.push({
          severity: "error",
          message: `Edge references non-existent source node: ${edge.source}`,
          elementType: "edge",
          code: "invalid-edge-source-node",
        });
      }

      // 检查目标节点存在性
      if (edge.target && !nodeMap.has(edge.target)) {
        issues.push({
          severity: "error",
          message: `Edge references non-existent target node: ${edge.target}`,
          elementType: "edge",
          code: "invalid-edge-target-node",
        });
      }

      // 检查源输出端口存在性
      if (edge.source && edge.sourceHandle && nodeMap.has(edge.source)) {
        const sourceNode = nodeMap.get(edge.source)!;
        const sourceOutputs = (sourceNode.data.outputs || []).map(
          (output) => output.id
        );
        // Strip -handle suffix for validation (frontend uses field_name-handle format)
        const handleToCheck = edge.sourceHandle.endsWith("-handle")
          ? edge.sourceHandle.slice(0, -7)
          : edge.sourceHandle;
        if (!sourceOutputs.includes(handleToCheck)) {
          issues.push({
            severity: "error",
            message: `Edge references non-existent output handle ${edge.sourceHandle} on node ${edge.source}`,
            elementType: "edge",
            code: "invalid-edge-source-handle",
          });
        }
      }

      // 检查目标输入端口存在性
      if (edge.target && edge.targetHandle && nodeMap.has(edge.target)) {
        const targetNode = nodeMap.get(edge.target)!;
        const targetInputs = this.getValidInputHandles(targetNode);
        // Strip -handle suffix for validation (frontend uses field_name-handle format)
        const handleToCheck = edge.targetHandle.endsWith("-handle")
          ? edge.targetHandle.slice(0, -7)
          : edge.targetHandle;
        if (!targetInputs.includes(handleToCheck)) {
          issues.push({
            severity: "error",
            message: `Edge references non-existent input handle ${edge.targetHandle} on node ${edge.target}`,
            elementType: "edge",
            code: "invalid-edge-target-handle",
          });
        }
      }
    });

    return issues;
  }

  /**
   * 获取节点有效的输入句柄列表，包含动态参数
   */
  private getValidInputHandles(node: EssentialNode): string[] {
    const inputs = node.data?.inputs || [];
    const handleIds = inputs.map((input) => input.id);

    // ai_model_node 支持通过 parameters 定义动态句柄
    if (node.type === "ai_model_node") {
      const parametersInput = inputs.find((input) => input.id === "parameters");
      const parameterValue = parametersInput?.value;

      if (Array.isArray(parameterValue)) {
        parameterValue.forEach((param) => {
          const paramName =
            typeof param === "string"
              ? param
              : typeof param?.name === "string"
              ? param.name
              : undefined;

          if (paramName) {
            const normalized = paramName.trim();
            if (normalized && !handleIds.includes(normalized)) {
              handleIds.push(normalized);
            }
          }
        });
      }
    }

    return handleIds;
  }

  /**
   * 检查流程完整性
   */
  private lintFlowIntegrity(data: FlowData): LintIssue[] {
    const issues: LintIssue[] = [];

    // 检查是否有孤立节点（没有连接的节点）
    const connectedNodes = new Set<string>();
    data.edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    data.nodes.forEach((node) => {
      if (!connectedNodes.has(node.id) && data.nodes.length > 1) {
        issues.push({
          severity: "warning",
          message: `Node ${node.id} is isolated (not connected to any other nodes)`,
          elementId: node.id,
          elementType: "node",
          code: "isolated-node",
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
          message: `Circular dependency detected: ${cycle.join(" -> ")}`,
          code: "circular-dependency",
        });
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // 查找所有从当前节点出发的边
      const outgoingEdges = data.edges.filter((edge) => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (dfs(edge.target, [...path, nodeId])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // 对每个节点进行 DFS
    data.nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return issues;
  }

  /**
   * 检查输入是否被连接
   */
  private isInputConnected(nodeId: string, inputId: string): boolean {
    if (!this.edges || this.edges.length === 0) {
      return false;
    }

    // 检查是否有边连接到这个输入
    // targetHandle 格式可能是 "inputId" 或 "nodeId__inputId"
    return this.edges.some((edge) => {
      if (edge.target !== nodeId) {
        return false;
      }

      // 检查 targetHandle
      if (!edge.targetHandle) {
        return false;
      }

      // 可能的格式：
      // 1. "inputId"
      // 2. "nodeId__inputId"
      if (edge.targetHandle === inputId) {
        return true;
      }

      const parts = edge.targetHandle.split("__");
      if (parts.length > 1 && parts[1] === inputId) {
        return true;
      }

      return false;
    });
  }

  /**
   * 检查值是否为空
   */
  private isEmptyValue(value: unknown): boolean {
    // null 或 undefined
    if (value === null || value === undefined) {
      return true;
    }

    // "RECEIVING INPUT" 不算空值（前端连接状态的占位符）
    if (value === "RECEIVING INPUT" || value === "RECEIVING_INPUT") {
      return false;
    }

    // 空字符串
    if (typeof value === "string" && value.trim() === "") {
      return true;
    }

    // 空数组
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    // 空对象（但排除有意义的对象如 Date）
    if (typeof value === "object" && !Array.isArray(value)) {
      // 排除 Date 等特殊对象
      if (value instanceof Date || value instanceof RegExp) {
        return false;
      }
      // 空对象 {}
      if (Object.keys(value).length === 0) {
        return true;
      }
    }

    return false;
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
   * 检查节点版本
   */
  private lintNodeVersion(node: EssentialNode): LintIssue[] {
    const issues: LintIssue[] = [];

    // 获取版本信息
    const version = (node as any).version || (node.data as any)?.version;

    // 如果没有版本信息，给出信息提示
    if (!version) {
      issues.push({
        severity: "warning",
        message: "No version specified, using default: 'latest'",
        elementId: node.id,
        elementType: "node",
        code: "missing-node-version",
      });
      return issues;
    }

    // 验证版本语法
    const versionValidation = this.validateVersionSyntax(version);
    if (!versionValidation.isValid) {
      issues.push({
        severity: "error",
        message:
          versionValidation.error ||
          `Invalid version specification: '${version}'`,
        elementId: node.id,
        elementType: "node",
        code: "invalid-version-syntax",
      });
      return issues;
    }

    // 检查预发布版本（警告）
    if (version.includes("-") && !version.startsWith("latest")) {
      issues.push({
        severity: "warning",
        message: `Using prerelease version: '${version}'. Consider using a stable version for production.`,
        elementId: node.id,
        elementType: "node",
        code: "prerelease-version",
      });
    }

    return issues;
  }

  /**
   * 验证版本语法
   */
  private validateVersionSyntax(version: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!version || typeof version !== "string") {
      return { isValid: false, error: "Version specification is required" };
    }

    // 定义有效的版本模式
    const patterns = {
      exact: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/, // 1.2.3, 1.2.3-beta.1
      latest: /^latest(-[a-zA-Z]+)?$/, // latest, latest-beta
      caret: /^\^\d+\.\d+\.\d+$/, // ^1.2.0
      tilde: /^~\d+\.\d+\.\d+$/, // ~1.2.0
      comparison: /^(>=?|<=?|>|<)\d+\.\d+\.\d+$/, // >=1.0.0, <2.0.0
    };

    // 检查是否匹配任何有效模式
    for (const pattern of Object.values(patterns)) {
      if (pattern.test(version)) {
        return { isValid: true };
      }
    }

    return {
      isValid: false,
      error: `Invalid version specification: '${version}'. Expected format: '1.2.3', 'latest', '^1.2.0', '~1.2.0', etc.`,
    };
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
export function lintNodeExecution(
  data: FlowData,
  options?: Omit<LintOptions, "mode">
): LintIssue[] {
  const linter = new TFLLint({ ...options, mode: "node" });
  return linter.lintFlow(data);
}
