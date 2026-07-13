export type NodeType =
  | "service"
  | "database"
  | "cache"
  | "queue"
  | "external"
  | "infrastructure";

export type CommunicationMode =
  | "sync_request_response"
  | "async_message"
  | "one_way_notification"
  | "publish_subscribe"
  | "event_broadcast";

export type ProtocolType =
  | "http_rest"
  | "grpc"
  | "graphql"
  | "websocket"
  | "amqp"
  | "kafka"
  | "database"
  | "custom";

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  description: string | null;
  position: Position;
  properties: Record<string, any>;
  metadata: Record<string, any>;
}

export interface DataCarrier {
  format: string;
  schema_ref: string | null;
  inline_schema: any | null;
}

export interface Connection {
  id: string;
  source_node_id: string;
  target_node_id: string;
  mode: CommunicationMode;
  protocol: ProtocolType;
  data_carrier: DataCarrier | null;
  description: string | null;
  metadata: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  version: string;
  nodes: Node[];
  connections: Connection[];
  metadata: Record<string, any>;
}

export interface ValidationResult {
  rule: string;
  severity: "error" | "warning";
  message: string;
  entities: string[]; // Node or Connection IDs
  suggestion: string | null;
}
