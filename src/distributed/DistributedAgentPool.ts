export interface ExternalWorkerNode {
  id: string;
  name: string;
  type: 'jules-agent' | 'custom-worker';
  endpoint: string;
  isAvailable: boolean;
}

export class DistributedAgentPool {
  private nodes: Map<string, ExternalWorkerNode> = new Map();

  registerNode(node: ExternalWorkerNode): void {
    this.nodes.set(node.id, node);
  }

  getAvailableNodes(): ExternalWorkerNode[] {
    return Array.from(this.nodes.values()).filter(n => n.isAvailable);
  }

  async dispatchExternalJob(nodeId: string, jobPayload: Record<string, unknown>): Promise<{ success: boolean; output: unknown }> {
    const node = this.nodes.get(nodeId);
    if (!node || !node.isAvailable) {
      throw new Error(`Worker node ${nodeId} is unavailable.`);
    }
    return {
      success: true,
      output: `External ${node.type} (${node.name}) processed payload: ${JSON.stringify(jobPayload)}`
    };
  }
}
