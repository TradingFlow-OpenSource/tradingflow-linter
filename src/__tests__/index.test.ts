import { TFLLint, FlowData, Node, Edge } from '../index';
import { describe, expect, it, beforeEach } from '@jest/globals';

describe('TFLLint', () => {
  let lint: TFLLint;

  beforeEach(() => {
    lint = new TFLLint();
  });

  describe('Node Type Support', () => {
    it('should return all supported node types', () => {
      const nodeTypes = lint.getSupportedNodeTypes();
      expect(nodeTypes).toContain('x_listener_node');
      expect(nodeTypes).toContain('ai_model_node');
      expect(nodeTypes).toContain('buy_node');
      expect(nodeTypes).toContain('telegram_sender_node');
      expect(nodeTypes).toHaveLength(12);
    });

    it('should get node definition for valid node type', () => {
      const definition = lint.getNodeDefinition('x_listener_node');
      expect(definition).toBeDefined();
      expect(definition?.type).toBe('x_listener_node');
      expect(definition?.category).toBe('input');
      expect(definition?.requiredInputs).toContain('accounts');
      expect(definition?.outputs).toContain('latest tweets');
    });

    it('should return undefined for invalid node type', () => {
      const definition = lint.getNodeDefinition('invalid_node' as any);
      expect(definition).toBeUndefined();
    });
  });

  describe('Basic Flow Validation', () => {
    it('should validate empty flow', () => {
      const data: FlowData = {
        nodes: [],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues).toHaveLength(0);
    });

    it('should report error for null flow data', () => {
      const issues = lint.lintFlow(null as any);
      expect(issues).toHaveLength(1);
      expect(issues[0].code).toBe('invalid-flow-data');
      expect(issues[0].severity).toBe('error');
    });

    it('should report error for missing nodes array', () => {
      const issues = lint.lintFlow({ edges: [] } as any);
      expect(issues).toHaveLength(1);
      expect(issues[0].code).toBe('missing-nodes-array');
    });

    it('should report error for missing edges array', () => {
      const issues = lint.lintFlow({ nodes: [] } as any);
      expect(issues).toHaveLength(1);
      expect(issues[0].code).toBe('missing-edges-array');
    });
  });

  describe('Node Validation', () => {
    it('should validate valid TFL Essential node', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'x_listener_node_1',
            type: 'x_listener_node',
            position: { x: 100, y: 100 },
            title: 'Twitter Monitor',
            description: 'Monitors Twitter accounts',
            inputs: [
              { id: 'accounts', value: ['realDonaldTrump'] },
              { id: 'keywords', value: 'crypto' }
            ],
            outputs: [
              { id: 'latest tweets', isDeleted: false }
            ]
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues).toHaveLength(0);
    });

    it('should report error for missing node id', () => {
      const data: FlowData = {
        nodes: [
          {
            id: '',
            type: 'x_listener_node',
            position: { x: 0, y: 0 }
          } as Node
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'missing-node-id')).toBe(true);
    });

    it('should report error for duplicate node ids', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'node1',
            type: 'x_listener_node',
            position: { x: 0, y: 0 }
          },
          {
            id: 'node1',
            type: 'ai_model_node',
            position: { x: 100, y: 0 }
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'duplicate-node-id')).toBe(true);
    });

    it('should report error for invalid node type', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'node1',
            type: 'invalid_type',
            position: { x: 0, y: 0 }
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'invalid-node-type')).toBe(true);
    });

    it('should report error for missing required inputs', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'x_listener_node_1',
            type: 'x_listener_node',
            position: { x: 0, y: 0 },
            inputs: [
              { id: 'keywords', value: 'crypto' }
              // Missing required 'accounts' input
            ]
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'missing-required-input')).toBe(true);
    });

    it('should warn about unknown inputs', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'x_listener_node_1',
            type: 'x_listener_node',
            position: { x: 0, y: 0 },
            inputs: [
              { id: 'accounts', value: ['test'] },
              { id: 'unknown_input', value: 'test' }
            ]
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'unknown-input' && issue.severity === 'warning')).toBe(true);
    });

    it('should report error for invalid output structure', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'x_listener_node_1',
            type: 'x_listener_node',
            position: { x: 0, y: 0 },
            inputs: [{ id: 'accounts', value: ['test'] }],
            outputs: [
              { id: 'latest tweets', isDeleted: 'invalid' as any }
            ]
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'invalid-output-isdeleted')).toBe(true);
    });

    it('should warn about position overlap', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'node1',
            type: 'x_listener_node',
            position: { x: 0, y: 0 }
          },
          {
            id: 'node2',
            type: 'ai_model_node',
            position: { x: 10, y: 10 } // Overlapping position
          }
        ],
        edges: []
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'node-position-overlap')).toBe(true);
    });
  });

  describe('Edge Validation', () => {
    const validNodes: Node[] = [
      {
        id: 'source_node',
        type: 'x_listener_node',
        position: { x: 0, y: 0 },
        inputs: [{ id: 'accounts', value: ['test'] }],
        outputs: [{ id: 'latest tweets', isDeleted: false }]
      },
      {
        id: 'target_node',
        type: 'ai_model_node',
        position: { x: 200, y: 0 },
        inputs: [
          { id: 'model', value: 'gpt-4' },
          { id: 'prompt', value: 'Analyze this' }
        ],
        outputs: [{ id: 'ai_response', isDeleted: false }]
      }
    ];

    it('should validate valid edge', () => {
      const data: FlowData = {
        nodes: validNodes,
        edges: [
          {
            source: 'source_node',
            sourceHandle: 'latest tweets',
            target: 'target_node',
            targetHandle: 'prompt'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      const edgeIssues = issues.filter(issue => issue.elementType === 'edge');
      expect(edgeIssues).toHaveLength(0);
    });

    it('should report error for missing edge fields', () => {
      const data: FlowData = {
        nodes: validNodes,
        edges: [
          {
            source: '',
            sourceHandle: 'latest tweets',
            target: 'target_node',
            targetHandle: 'prompt'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'missing-edge-source')).toBe(true);
    });

    it('should report error for non-existent source node', () => {
      const data: FlowData = {
        nodes: validNodes,
        edges: [
          {
            source: 'non_existent_node',
            sourceHandle: 'output',
            target: 'target_node',
            targetHandle: 'prompt'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'invalid-edge-source-node')).toBe(true);
    });

    it('should report error for invalid source handle', () => {
      const data: FlowData = {
        nodes: validNodes,
        edges: [
          {
            source: 'source_node',
            sourceHandle: 'non_existent_output',
            target: 'target_node',
            targetHandle: 'prompt'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'invalid-edge-source-handle')).toBe(true);
    });

    it('should report error for invalid target handle', () => {
      const data: FlowData = {
        nodes: validNodes,
        edges: [
          {
            source: 'source_node',
            sourceHandle: 'latest tweets',
            target: 'target_node',
            targetHandle: 'non_existent_input'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'invalid-edge-target-handle')).toBe(true);
    });
  });

  describe('Flow Integrity', () => {
    it('should warn about isolated nodes', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'connected_node1',
            type: 'x_listener_node',
            position: { x: 0, y: 0 },
            outputs: [{ id: 'latest tweets', isDeleted: false }]
          },
          {
            id: 'connected_node2',
            type: 'ai_model_node',
            position: { x: 200, y: 0 },
            inputs: [{ id: 'prompt', value: 'test' }]
          },
          {
            id: 'isolated_node',
            type: 'telegram_sender_node',
            position: { x: 400, y: 0 }
          }
        ],
        edges: [
          {
            source: 'connected_node1',
            sourceHandle: 'latest tweets',
            target: 'connected_node2',
            targetHandle: 'prompt'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'isolated-node')).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const data: FlowData = {
        nodes: [
          {
            id: 'node1',
            type: 'ai_model_node',
            position: { x: 0, y: 0 },
            inputs: [{ id: 'prompt', value: 'test' }],
            outputs: [{ id: 'ai_response', isDeleted: false }]
          },
          {
            id: 'node2',
            type: 'code_node',
            position: { x: 200, y: 0 },
            inputs: [{ id: 'python_code', value: 'test' }],
            outputs: [{ id: 'output_data', isDeleted: false }]
          }
        ],
        edges: [
          {
            source: 'node1',
            sourceHandle: 'ai_response',
            target: 'node2',
            targetHandle: 'python_code'
          },
          {
            source: 'node2',
            sourceHandle: 'output_data',
            target: 'node1',
            targetHandle: 'prompt'
          }
        ]
      };

      const issues = lint.lintFlow(data);
      expect(issues.some(issue => issue.code === 'circular-dependency')).toBe(true);
    });
  });
});
