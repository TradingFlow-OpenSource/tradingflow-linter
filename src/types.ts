// TFL Essential Version Types
export interface Position {
  x: number;
  y: number;
}

export interface NodeInput {
  id: string;
  value: any;
}

export interface NodeOutput {
  id: string;
  isDeleted: boolean;
}

export interface Node {
  id: string;
  type: string;
  position: Position;
  title?: string;
  description?: string;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  data?: Record<string, any>;
  [key: string]: any;
}

export interface Edge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  [key: string]: any;
}

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

// 支持的节点类型
export type NodeType = 
  // Input Nodes
  | 'binance_price_node'
  | 'dataset_input_node'
  | 'rss_listener_node'
  | 'x_listener_node'
  // Compute Nodes
  | 'ai_model_node'
  | 'code_node'
  // Trade Nodes
  | 'swap_node'
  | 'buy_node'
  | 'sell_node'
  | 'vault_node'
  // Output Nodes
  | 'dataset_output_node'
  | 'telegram_sender_node';

// 节点定义接口
export interface NodeDefinition {
  type: NodeType;
  description: string;
  category: 'input' | 'compute' | 'trade' | 'output';
  requiredInputs: string[];
  optionalInputs: string[];
  outputs: string[];
}
