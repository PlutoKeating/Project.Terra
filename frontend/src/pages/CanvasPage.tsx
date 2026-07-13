import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Cpu,
  Database,
  Zap,
  Globe,
  Sliders,
  Network,
  Undo2,
  Save,
  CheckCircle,
  AlertTriangle,
  X,
  HelpCircle,
  MousePointer,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { designSystem } from "../designSystem";
import { Node, Connection, Project, NodeType, CommunicationMode, ProtocolType, ValidationResult } from "../types";
import RainbowStrip from "../components/RainbowStrip";
import { apiFetch } from "../apiFetch";

// Icon mapper for 6 NodeType categories specified in §4.2
const NODE_ICONS: Record<NodeType, React.ReactNode> = {
  service: <Cpu size={16} />,
  database: <Database size={16} />,
  cache: <Zap size={16} />,
  queue: <RefreshCw size={16} />,
  external: <Globe size={16} />,
  infrastructure: <Network size={16} />,
};

// Colors for node categories based on Retro design scheme (used for accents / tags)
const NODE_COLOR_ACCENTS: Record<NodeType, string> = {
  service: "#4f378a",       // Deep Purple
  database: "#765b00",      // Warm Amber
  cache: "#e67e22",         // Retro Orange
  queue: "#3498db",         // Ocean Blue
  external: "#9b59b6",      // Purple Orchid
  infrastructure: "#52b788", // Forest Green
};

export default function CanvasPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Primary Workspace States
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Active interaction modes
  const [linkModeActive, setLinkModeActive] = useState(false);
  const [linkSourceNodeId, setLinkSourceNodeId] = useState<string | null>(null);
  const [draftingMousePos, setDraftingMousePos] = useState({ x: 0, y: 0 });

  // Pan & Zoom parameters
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node variables
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });

  // Backend Validation States
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validating, setValidating] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [highlightedEntities, setHighlightedEntities] = useState<string[]>([]);

  // Local Undo History Stack
  const [undoStack, setUndoStack] = useState<string[]>([]); // JSON representation of historical project states
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "unsaved">("synced");

  // Export popup content
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"yaml" | "json">("yaml");
  const [exportedText, setExportedText] = useState("");

  // Refs
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);

  // ==================== INITIAL LOAD ====================

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/v1/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("找不到该架构设计项目，可能已被删除。");
        }
        throw new Error("无法连接后端获取详情，请检查服务器运行状态。");
      }
      const data = await res.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message || "加载项目数据出错");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // ==================== UNDO/REDO HISTORICAL STACK ====================

  const pushStateToUndo = (currentProj: Project) => {
    const serialized = JSON.stringify(currentProj);
    setUndoStack((prev) => [...prev, serialized]);
    setSyncStatus("unsaved");
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !project) return;
    const previousStateJson = undoStack[undoStack.length - 1];
    const previousProject: Project = JSON.parse(previousStateJson);

    // Set state
    setProject(previousProject);
    setUndoStack((prev) => prev.slice(0, -1));

    // Save state back to server
    persistFullProjectState(previousProject);
  };

  // Synchronize entire state back to database (fallback helper)
  const persistFullProjectState = async (projState: Project) => {
    setSyncStatus("saving");
    try {
      // 1. Sync metadata
      await apiFetch(`/api/v1/projects/${projState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projState.name,
          description: projState.description,
        }),
      });

      // 2. We can recreate the state or put nodes sequentially.
      // To keep it simple and robust, we can update coordinates and nodes on demand.
      // But the best approach is: since nodes and connections have specific PUT handlers,
      // we persist individual nodes and connections or simply let backend receive the final state!
      // Wait, our backend supports individual CRUD operations. For a quick full sync,
      // we can trigger the node positions and links creation/updates as required.
      // Let's make sure that whenever nodes are created or deleted, we send the exact API calls!
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to persist full project state", err);
      setSyncStatus("unsaved");
    }
  };

  // ==================== DRAG & DROP FOR NODES ====================

  const handleNodeMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation(); // Avoid triggering pan on canvas background
    setSelectedNodeId(node.id);
    setSelectedConnectionId(null);

    if (linkModeActive) {
      // If we are drafting a link and click on the same node, do nothing.
      // Otherwise, we trigger connection completion!
      if (linkSourceNodeId && linkSourceNodeId !== node.id) {
        completeConnection(linkSourceNodeId, node.id);
      }
      return;
    }

    setDraggingNodeId(node.id);
    // Track offset where mouse clicked relative to node position x/y
    // We adjust for current zoom
    const rect = canvasViewportRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStartOffset({
        x: (e.clientX - rect.left) / zoom - node.position.x,
        y: (e.clientY - rect.top) / zoom - node.position.y,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasViewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeMouseX = (e.clientX - rect.left) / zoom;
    const relativeMouseY = (e.clientY - rect.top) / zoom;

    // Handle Node Drag
    if (draggingNodeId && project) {
      const updatedNodes = project.nodes.map((node) => {
        if (node.id === draggingNodeId) {
          return {
            ...node,
            position: {
              x: Math.round(relativeMouseX - dragStartOffset.x),
              y: Math.round(relativeMouseY - dragStartOffset.y),
            },
          };
        }
        return node;
      });

      setProject({
        ...project,
        nodes: updatedNodes,
      });
      setSyncStatus("unsaved");
    }

    // Handle Link drafting preview line update
    if (linkModeActive) {
      setDraftingMousePos({
        x: relativeMouseX,
        y: relativeMouseY,
      });
    }

    // Handle Board Panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = async (e: React.MouseEvent) => {
    if (draggingNodeId && project) {
      // Node drag finished! Store to history and send coordinates PUT API to backend
      const draggedNode = project.nodes.find((n) => n.id === draggingNodeId);
      if (draggedNode) {
        pushStateToUndo(project);

        try {
          setSyncStatus("saving");
          const res = await apiFetch(`/api/v1/projects/${project.id}/nodes/${draggedNode.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draggedNode),
          });
          if (!res.ok) throw new Error("保存节点坐标失败");
          setSyncStatus("synced");
        } catch (err) {
          console.error(err);
          setSyncStatus("unsaved");
        }
      }
      setDraggingNodeId(null);
    }

    if (isPanning) {
      setIsPanning(false);
    }
  };

  // ==================== BOARD ACTIONS ====================

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.8));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.4));
  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasBackgroundMouseDown = (e: React.MouseEvent) => {
    // Clear selection
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setHighlightedEntities([]);

    if (linkModeActive) {
      // Cancel connection drafting
      cancelLinkMode();
      return;
    }

    // Start Board panning
    setIsPanning(true);
    setPanStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  // ==================== NODE OPERATIONS ====================

  const addNewNodeOfType = async (type: NodeType) => {
    if (!project) return;
    pushStateToUndo(project);

    // Insert somewhat centered in current view
    const x = Math.round(150 - pan.x / zoom + Math.random() * 50);
    const y = Math.round(150 - pan.y / zoom + Math.random() * 50);

    const labels: Record<NodeType, string> = {
      service: "Micro Service",
      database: "Relational DB",
      cache: "Memory Cache",
      queue: "Topic Bus",
      external: "Payment Gate",
      infrastructure: "Ingress Router",
    };

    const nodePayload = {
      type,
      label: `${labels[type]}_01`,
      description: `新建 ${type} 微架构模块`,
      position: { x, y },
      properties: type === "database" ? { engine: "PostgreSQL" } : {},
      metadata: {},
    };

    try {
      setSyncStatus("saving");
      const res = await apiFetch(`/api/v1/projects/${project.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nodePayload),
      });

      if (!res.ok) throw new Error("无法在服务器端创建节点");
      const createdNode: Node = await res.json();

      setProject({
        ...project,
        nodes: [...project.nodes, createdNode],
      });
      setSelectedNodeId(createdNode.id);
      setSelectedConnectionId(null);
      setSyncStatus("synced");
    } catch (err) {
      alert("创建节点出错: " + err);
      setSyncStatus("unsaved");
    }
  };

  const deleteSelectedNode = async (nodeId: string) => {
    if (!project) return;
    pushStateToUndo(project);

    try {
      setSyncStatus("saving");
      const res = await apiFetch(`/api/v1/projects/${project.id}/nodes/${nodeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("服务端删除节点失败");

      // Update locally
      const updatedNodes = project.nodes.filter((n) => n.id !== nodeId);
      // Cascade delete connections referencing this node
      const updatedConnections = project.connections.filter(
        (c) => c.source_node_id !== nodeId && c.target_node_id !== nodeId
      );

      setProject({
        ...project,
        nodes: updatedNodes,
        connections: updatedConnections,
      });

      setSelectedNodeId(null);
      setSyncStatus("synced");
    } catch (err) {
      alert("删除节点出错: " + err);
      setSyncStatus("unsaved");
    }
  };

  const updateNodeProperties = async (nodeId: string, label: string, description: string | null, properties: any) => {
    if (!project) return;
    const targetNode = project.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    pushStateToUndo(project);

    const updatedNode = {
      ...targetNode,
      label,
      description,
      properties,
    };

    // Update locally
    const updatedNodes = project.nodes.map((n) => (n.id === nodeId ? updatedNode : n));
    setProject({
      ...project,
      nodes: updatedNodes,
    });

    try {
      setSyncStatus("saving");
      const res = await apiFetch(`/api/v1/projects/${project.id}/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNode),
      });
      if (!res.ok) throw new Error("保存节点属性失败");
      setSyncStatus("synced");
    } catch (err) {
      console.error(err);
      setSyncStatus("unsaved");
    }
  };

  // ==================== CONNECTION OPERATIONS ====================

  const initiateLinkMode = (nodeId: string) => {
    const node = project?.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setLinkModeActive(true);
    setLinkSourceNodeId(nodeId);
    setDraftingMousePos({
      x: node.position.x + 80,
      y: node.position.y + 40,
    });
  };

  const cancelLinkMode = () => {
    setLinkModeActive(false);
    setLinkSourceNodeId(null);
  };

  const completeConnection = async (sourceId: string, targetId: string) => {
    if (!project) return;

    // Check if link already exists to prevent duplicate links
    const exists = project.connections.some(
      (c) => c.source_node_id === sourceId && c.target_node_id === targetId
    );
    if (exists) {
      alert("此微架构节点间已经存在连接通路！");
      cancelLinkMode();
      return;
    }

    pushStateToUndo(project);

    const connectionPayload = {
      source_node_id: sourceId,
      target_node_id: targetId,
      mode: "sync_request_response",
      protocol: "http_rest",
      data_carrier: null,
      description: "微架构调用链路",
      metadata: {},
    };

    try {
      setSyncStatus("saving");
      const res = await apiFetch(`/api/v1/projects/${project.id}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionPayload),
      });

      if (!res.ok) throw new Error("服务端创建连线失败");
      const createdConnection: Connection = await res.json();

      setProject({
        ...project,
        connections: [...project.connections, createdConnection],
      });

      setSelectedConnectionId(createdConnection.id);
      setSelectedNodeId(null);
      setSyncStatus("synced");
    } catch (err) {
      alert("创建连线链路出错: " + err);
      setSyncStatus("unsaved");
    } finally {
      cancelLinkMode();
    }
  };

  const deleteSelectedConnection = async (connectionId: string) => {
    if (!project) return;
    pushStateToUndo(project);

    try {
      setSyncStatus("saving");
      const res = await apiFetch(`/api/v1/projects/${project.id}/connections/${connectionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("服务端删除连线失败");

      const updatedConnections = project.connections.filter((c) => c.id !== connectionId);
      setProject({
        ...project,
        connections: updatedConnections,
      });

      setSelectedConnectionId(null);
      setSyncStatus("synced");
    } catch (err) {
      alert("删除连线链路出错: " + err);
      setSyncStatus("unsaved");
    }
  };

  const updateConnectionProperties = async (
    connectionId: string,
    mode: CommunicationMode,
    protocol: ProtocolType,
    description: string | null,
    format: string,
    inlineSchemaText: string
  ) => {
    if (!project) return;
    const targetConn = project.connections.find((c) => c.id === connectionId);
    if (!targetConn) return;

    pushStateToUndo(project);

    let parsedInlineSchema = null;
    if (inlineSchemaText.trim()) {
      try {
        parsedInlineSchema = JSON.parse(inlineSchemaText);
      } catch (err) {
        // Fallback as raw text or standard JSON
        parsedInlineSchema = { raw: inlineSchemaText };
      }
    }

    const updatedConn: Connection = {
      ...targetConn,
      mode,
      protocol,
      description,
      data_carrier: format
        ? {
            format,
            schema_ref: null,
            inline_schema: parsedInlineSchema,
          }
        : null,
    };

    // Update locally
    const updatedConns = project.connections.map((c) => (c.id === connectionId ? updatedConn : c));
    setProject({
      ...project,
      connections: updatedConns,
    });

    try {
      setSyncStatus("saving");
      const res = await apiFetch(`/api/v1/projects/${project.id}/connections/${connectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConn),
      });
      if (!res.ok) throw new Error("保存连线属性失败");
      setSyncStatus("synced");
    } catch (err) {
      console.error(err);
      setSyncStatus("unsaved");
    }
  };

  // ==================== SERVER VALIDATION ====================

  const runValidation = async () => {
    if (!project) return;
    setValidating(true);
    try {
      const res = await apiFetch(`/api/v1/projects/${project.id}/validate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("调用校验接口失败");
      const results: ValidationResult[] = await res.json();
      setValidationResults(results);
      setShowValidationPanel(true);
    } catch (err: any) {
      alert(err.message || "执行校验诊断失败");
    } finally {
      setValidating(false);
    }
  };

  // ==================== EXPORT SYSTEM ====================

  const triggerExport = async (format: "yaml" | "json") => {
    if (!project) return;
    setExportFormat(format);
    try {
      const res = await apiFetch(`/api/v1/projects/${project.id}/export?format=${format}`);
      if (!res.ok) throw new Error("导出失败");
      const data = await res.json();

      if (format === "yaml") {
        setExportedText(data.yaml);
      } else {
        setExportedText(JSON.stringify(data, null, 2));
      }
      setShowExportModal(true);
    } catch (err: any) {
      alert("导出错误: " + err.message);
    }
  };

  const copyExportToClipboard = () => {
    navigator.clipboard.writeText(exportedText);
    alert("已成功复制到剪贴板！可以保存为 .terra.yaml 文件纳入版本控制。");
  };

  // ==================== SHORTCUTS MANAGER ====================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is currently typing in input elements
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
        return;
      }

      // N — New Node (Defaulting to service)
      if (e.key.toLowerCase() === "n") {
        addNewNodeOfType("service");
        e.preventDefault();
      }

      // L — Initiate linking mode
      if (e.key.toLowerCase() === "l" && selectedNodeId) {
        initiateLinkMode(selectedNodeId);
        e.preventDefault();
      }

      // Delete/Backspace — Delete element
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          deleteSelectedNode(selectedNodeId);
          e.preventDefault();
        } else if (selectedConnectionId) {
          deleteSelectedConnection(selectedConnectionId);
          e.preventDefault();
        }
      }

      // Escape — Cancel action
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setSelectedConnectionId(null);
        cancelLinkMode();
        setHighlightedEntities([]);
        e.preventDefault();
      }

      // Ctrl/Cmd + Z — Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        handleUndo();
        e.preventDefault();
      }

      // Ctrl/Cmd + S — Trigger Save validation state
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        runValidation();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, selectedConnectionId, linkModeActive, project, undoStack]);

  // Handle Zoom on Mouse Wheel / Trackpad over the canvas stage and prevent page scrolling
  useEffect(() => {
    const stage = canvasStageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 0.05;
      if (e.deltaY < 0) {
        // Zoom in
        setZoom((z) => Math.min(z + zoomFactor, 1.8));
      } else {
        // Zoom out
        setZoom((z) => Math.max(z - zoomFactor, 0.4));
      }
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // ==================== RENDERING UTILS ====================

  if (loading) {
    return (
      <div className="py-40 text-center font-mono text-xs tracking-widest text-gray-500">
        [ PARSING TOPOLOGY GRAPH ENGINE... ]
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto my-20 p-6 border border-rose-300 bg-rose-50 text-rose-950 font-courier">
        <h3 className="font-bold text-lg mb-2">Error Accessing Canvas</h3>
        <p className="font-mono text-xs mb-6">{error || "项目加载异常。"}</p>
        <Link
          to="/"
          className="px-4 py-2 bg-black text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-gray-800"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  // Find coordinates for a node to draw SVG links correctly
  const getNodeCenter = (nodeId: string) => {
    const nd = project.nodes.find((n) => n.id === nodeId);
    if (!nd) return { x: 0, y: 0 };
    // Node dimensions: 180 width, 80 height
    return {
      x: nd.position.x + 90,
      y: nd.position.y + 40,
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] w-full overflow-hidden" id="editor-workspace">
      
      {/* Dynamic Sub-header Navigation Panel */}
      <div
        className="h-14 border-b flex items-center justify-between px-6 shrink-0"
        style={{
          backgroundColor: designSystem.colors.surfaceContainerLow,
          borderColor: designSystem.colors.borderLight,
        }}
        id="editor-sub-bar"
      >
        <div className="flex items-center space-x-6" id="editor-sub-bar-left">
          <Link
            to="/"
            className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest hover:text-black text-gray-500"
            id="back-to-list-link"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>

          <span className="text-gray-300">|</span>

          <div className="flex items-center space-x-2" id="project-metadata-display">
            <h2 className="font-courier font-bold text-sm text-black">
              {project.name}
            </h2>
            <span className="font-mono text-[9px] px-1.5 py-0.5 border text-gray-500 bg-white border-gray-200">
              v{project.version}
            </span>
          </div>

          {/* Sync indicator */}
          <span className="font-mono text-[10px] uppercase text-gray-400 tracking-wider">
            {syncStatus === "synced" && "● Synced"}
            {syncStatus === "saving" && "◌ Saving..."}
            {syncStatus === "unsaved" && "▲ Unsaved"}
          </span>
        </div>

        {/* Action controls (Validate, Export, Undo) */}
        <div className="flex items-center space-x-3" id="editor-sub-bar-right">
          
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`px-3 py-1.5 border font-mono text-[11px] uppercase tracking-wider font-bold flex items-center space-x-1 ${
              undoStack.length === 0
                ? "text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50"
                : "bg-white hover:bg-gray-50 text-gray-800"
            }`}
            style={{
              borderColor: undoStack.length > 0 ? designSystem.colors.borderDark : designSystem.colors.borderLight,
            }}
            title="Undo (Ctrl+Z)"
            id="editor-undo-btn"
          >
            <Undo2 size={12} />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={runValidation}
            disabled={validating}
            className="px-3 py-1.5 bg-black text-white hover:bg-gray-800 font-mono text-[11px] uppercase tracking-wider font-bold flex items-center space-x-1.5"
            id="editor-validate-btn"
          >
            {validating ? (
              <span className="animate-spin text-white">◌</span>
            ) : (
              <Play size={11} className="text-emerald-400 fill-emerald-400" />
            )}
            <span>Validate</span>
          </button>

          <div className="relative group" id="export-dropdown-wrapper">
            <button
              onClick={() => triggerExport("yaml")}
              className="px-3 py-1.5 border bg-white text-gray-800 hover:bg-gray-50 font-mono text-[11px] uppercase tracking-wider font-bold flex items-center space-x-1"
              style={{ borderColor: designSystem.colors.borderDark }}
              id="editor-export-btn"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border shadow-lg z-50 py-1 w-32" style={{ borderColor: designSystem.colors.borderDark }}>
              <button
                onClick={() => triggerExport("yaml")}
                className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-purple-50 text-purple-900"
              >
                Export YAML
              </button>
              <button
                onClick={() => triggerExport("json")}
                className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-purple-50 text-purple-900"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body: Left Palette + Middle Canvas + Right Drawer */}
      <div className="flex-1 flex w-full overflow-hidden relative" id="editor-main-columns">
        
        {/* LEFT COLUMN: PALETTE - Click Node template types */}
        <div
          className="w-64 border-r flex flex-col justify-between shrink-0"
          style={{
            backgroundColor: designSystem.colors.surfaceContainerLowest,
            borderColor: designSystem.colors.borderLight,
          }}
          id="editor-left-palette"
        >
          <div>
            <div className="p-4 border-b bg-gray-50" style={{ borderColor: designSystem.colors.borderLight }}>
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
                Palette
              </h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-1">
                v1.0.4 // Hardware Units
              </p>
            </div>

            <div className="p-4 space-y-3" id="palette-node-items">
              <span className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Click template to add:
              </span>

              {Object.keys(NODE_ICONS).map((typeKey) => {
                const type = typeKey as NodeType;
                const accent = NODE_COLOR_ACCENTS[type];
                return (
                  <button
                    key={type}
                    onClick={() => addNewNodeOfType(type)}
                    className="w-full p-2.5 border text-left flex items-center space-x-3 transition-all hover:translate-x-1 group relative overflow-hidden"
                    style={{
                      borderColor: designSystem.colors.borderLight,
                      backgroundColor: designSystem.colors.surfaceContainerLow,
                    }}
                    id={`palette-btn-${type}`}
                  >
                    {/* Small vertical rainbow/color tab on left */}
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} />

                    <div className="p-1.5 border bg-white" style={{ borderColor: designSystem.colors.borderLight, color: accent }}>
                      {NODE_ICONS[type]}
                    </div>
                    <div>
                      <span className="block font-mono text-xs font-bold text-gray-800 capitalize">
                        {type}
                      </span>
                      <span className="block font-mono text-[9px] text-gray-400 uppercase tracking-widest">
                        Unit Module
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips block at bottom of palette */}
          <div className="p-4 border-t bg-amber-50/50" style={{ borderColor: designSystem.colors.borderLight }}>
            <h4 className="font-mono text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-1">
              Shortcuts (快捷键)
            </h4>
            <div className="space-y-1 text-[10px] font-mono text-amber-800">
              <p><kbd className="px-1 border bg-white rounded">N</kbd> : 新建微服务节点</p>
              <p><kbd className="px-1 border bg-white rounded">L</kbd> : 建立选中节点连线</p>
              <p><kbd className="px-1 border bg-white rounded">Del</kbd> : 删除选中元素</p>
              <p><kbd className="px-1 border bg-white rounded">ESC</kbd> : 取消当前编辑模式</p>
              <p><kbd className="px-1 border bg-white rounded">Ctrl+Z</kbd> : 撤销操作</p>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: THE DESIGN CANVAS */}
        <div
          ref={canvasStageRef}
          className="flex-1 h-full overflow-hidden bg-grid-dots relative select-none cursor-crosshair no-scrollbar"
          style={{ backgroundColor: designSystem.colors.surface }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseDown={handleCanvasBackgroundMouseDown}
          id="editor-canvas-stage"
        >
          {/* Zoom & Pan Applied Wrapper */}
          <div
            ref={canvasViewportRef}
            className="absolute inset-0 origin-top-left transition-transform duration-75 no-scrollbar"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: "5000px",
              height: "5000px",
            }}
            id="zoom-pan-container-viewport"
          >
            {/* SVG LINK PATHS CONNECTIONS CONTAINER */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full" id="svg-connections-layer">
              <defs>
                {/* Directed path end arrow markers */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#1d1b20" />
                </marker>
                <marker
                  id="arrow-selected"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="9"
                  markerHeight="9"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f378a" />
                </marker>
                <marker
                  id="arrow-highlight"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="9"
                  markerHeight="9"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ba1a1a" />
                </marker>
              </defs>

              {/* Draft temporary line when drawing a link connection */}
              {linkModeActive && linkSourceNodeId && (
                <line
                  x1={getNodeCenter(linkSourceNodeId).x}
                  y1={getNodeCenter(linkSourceNodeId).y}
                  x2={draftingMousePos.x}
                  y2={draftingMousePos.y}
                  stroke="#6750a4"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  id="link-drafting-line"
                />
              )}

              {/* Render persistent links */}
              {project.connections.map((c) => {
                const start = getNodeCenter(c.source_node_id);
                const end = getNodeCenter(c.target_node_id);
                const isSelected = selectedConnectionId === c.id;
                const isHighlighted = highlightedEntities.includes(c.id);

                // Math helper to draw standard straight path line
                const strokeColor = isHighlighted
                  ? designSystem.colors.error
                  : isSelected
                  ? designSystem.colors.primary
                  : "#1d1b20";

                const strokeWidth = isSelected || isHighlighted ? "3" : "1.5";
                const strokeDash = c.mode === "publish_subscribe" ? "4,4" : "none";

                return (
                  <g key={c.id} className="pointer-events-auto cursor-pointer" id={`g-connection-${c.id}`}>
                    {/* Hover hotspot helper path */}
                    <path
                      d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                      stroke="transparent"
                      strokeWidth="12"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnectionId(c.id);
                        setSelectedNodeId(null);
                      }}
                    />

                    {/* True drawn pathway link line */}
                    <path
                      d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={
                        isHighlighted
                          ? "url(#arrow-highlight)"
                          : isSelected
                          ? "url(#arrow-selected)"
                          : "url(#arrow)"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnectionId(c.id);
                        setSelectedNodeId(null);
                      }}
                      id={`line-path-${c.id}`}
                    />

                    {/* Protocol Text Badge overlay */}
                    {start.x !== 0 && end.x !== 0 && (
                      <g
                        transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConnectionId(c.id);
                          setSelectedNodeId(null);
                        }}
                      >
                        <rect
                          x="-45"
                          y="-9"
                          width="90"
                          height="18"
                          fill="#ffffff"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          className="font-mono text-[9px] uppercase font-bold tracking-wider"
                          fill={strokeColor}
                        >
                          {c.protocol}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* RENDER HARDWARE NODES ON CANVAS */}
            {project.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHighlighted = highlightedEntities.includes(node.id);
              const accentColor = NODE_COLOR_ACCENTS[node.type];

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  className="absolute w-[180px] h-[82px] bg-white border transition-shadow select-none group"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    borderColor: isHighlighted
                      ? designSystem.colors.error
                      : isSelected
                      ? designSystem.colors.primary
                      : designSystem.colors.borderDark,
                    borderWidth: isSelected || isHighlighted ? "2px" : "1px",
                    boxShadow: isSelected ? "4px 4px 0px #cbc4d2" : "none",
                  }}
                  id={`node-box-${node.id}`}
                >
                  {/* Top Rainbow Bar stack indicator for nodes */}
                  <div className="h-[4px] w-full overflow-hidden border-b border-gray-100 flex" id={`node-rainbow-${node.id}`}>
                    <RainbowStrip height="4px" />
                  </div>

                  {/* Body Content */}
                  <div className="p-3" id={`node-body-${node.id}`}>
                    {/* Header Label / Tag Icon */}
                    <div className="flex items-center justify-between" id={`node-top-row-${node.id}`}>
                      <div className="flex items-center space-x-1.5" id={`node-icon-title-${node.id}`}>
                        <span style={{ color: accentColor }} id={`node-icon-wrap-${node.id}`}>
                          {NODE_ICONS[node.type]}
                        </span>
                        <h4 className="font-mono text-xs font-bold text-gray-900 line-clamp-1" id={`node-label-${node.id}`}>
                          {node.label}
                        </h4>
                      </div>
                      <span
                        className="text-[8px] font-mono font-bold uppercase tracking-widest border px-1"
                        style={{
                          borderColor: accentColor,
                          color: accentColor,
                        }}
                      >
                        {node.type}
                      </span>
                    </div>

                    {/* Sub title description text */}
                    <p className="font-mono text-[9px] text-gray-400 line-clamp-1 mt-1.5" id={`node-desc-${node.id}`}>
                      {node.description || "无业务说明..."}
                    </p>
                  </div>

                  {/* Connection Anchor Button Overlay visible on hover */}
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      initiateLinkMode(node.id);
                    }}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border bg-white hover:bg-purple-100 flex items-center justify-center transition-all z-20 shadow cursor-pointer opacity-0 group-hover:opacity-100"
                    style={{ borderColor: designSystem.colors.borderDark, color: designSystem.colors.primary }}
                    title="Start Link (L)"
                    id={`node-link-anchor-${node.id}`}
                  >
                    <Plus size={12} />
                  </button>

                  {/* Delete entity mini button */}
                  {isSelected && (
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        deleteSelectedNode(node.id);
                      }}
                      className="absolute -top-3.5 -right-2 w-5 h-5 bg-red-50 hover:bg-red-100 border text-red-600 flex items-center justify-center rounded-full"
                      style={{ borderColor: designSystem.colors.error }}
                      title="Delete Unit"
                      id={`node-delete-anchor-${node.id}`}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* OVERLAY WIDGETS: ZOOM / PAN CONTROLS */}
          <div
            className="absolute bottom-6 left-6 border bg-white flex items-center divide-x"
            style={{ borderColor: designSystem.colors.borderDark }}
            id="viewport-control-bar"
          >
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-100 text-xs font-mono font-bold"
              title="Zoom In"
              id="btn-zoom-in"
            >
              +
            </button>
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-100 text-xs font-mono font-bold"
              title="Zoom Out"
              id="btn-zoom-out"
            >
              -
            </button>
            <button
              onClick={resetZoomPan}
              className="px-3 py-2 hover:bg-gray-100 text-[10px] font-mono uppercase font-bold"
              id="btn-reset-zoom"
            >
              Reset ({Math.round(zoom * 100)}%)
            </button>
          </div>

          {/* ACTIVE DRAFT STATE STATUS BAR IN CANVAS */}
          {linkModeActive && (
            <div
              className="absolute top-4 left-4 p-2 bg-purple-900 text-white font-mono text-[10px] uppercase tracking-wider border-2"
              style={{ borderColor: designSystem.colors.borderDark }}
              id="drafting-indicator"
            >
              [ CONNECTING MODE ACTIVE: CLICK ANOTHER NODE TO LINK // ESC TO CANCEL ]
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PROPERTY PANEL & VALIDATION DRAWER */}
        <div
          className="w-80 border-l flex flex-col justify-between shrink-0 bg-white"
          style={{ borderColor: designSystem.colors.borderLight }}
          id="editor-right-inspector"
        >
          {/* INSPECTOR VIEW */}
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar" id="inspector-content-wrapper">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between" style={{ borderColor: designSystem.colors.borderLight }}>
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
                Inspector
              </h3>
              <span className="font-mono text-[9px] text-gray-400">
                {selectedNodeId ? "NODE_PROPERTIES" : selectedConnectionId ? "LINK_PROPERTIES" : "SYSTEM_GENERAL"}
              </span>
            </div>

            {/* CASE A: Node Selected */}
            {selectedNodeId && (
              <NodeInspector
                node={project.nodes.find((n) => n.id === selectedNodeId)!}
                onUpdate={updateNodeProperties}
                onDelete={() => deleteSelectedNode(selectedNodeId)}
                onLink={() => initiateLinkMode(selectedNodeId)}
              />
            )}

            {/* CASE B: Link Connection Selected */}
            {selectedConnectionId && (
              <ConnectionInspector
                connection={project.connections.find((c) => c.id === selectedConnectionId)!}
                nodes={project.nodes}
                onUpdate={updateConnectionProperties}
                onDelete={() => deleteSelectedConnection(selectedConnectionId)}
              />
            )}

            {/* CASE C: Nothing Selected */}
            {!selectedNodeId && !selectedConnectionId && (
              <div className="p-6 text-center text-gray-400 font-mono text-xs py-20" id="empty-inspector">
                <MousePointer size={20} className="mx-auto mb-3 text-gray-300" />
                <p>未选中任何画布实体。</p>
                <p className="text-[10px] mt-2 text-gray-400 uppercase leading-relaxed">
                  点击节点添加关系链条，或从左侧面板添加全新节点到画布。
                </p>
              </div>
            )}
          </div>

          {/* DIAGNOSTIC PANEL SLIDE DRAWER AT BOTTOM OF RIGHT SIDEBAR */}
          <div className="border-t" style={{ borderColor: designSystem.colors.borderLight }} id="validation-drawer-tab">
            <button
              onClick={() => setShowValidationPanel(!showValidationPanel)}
              className="w-full p-4 flex items-center justify-between font-mono text-xs uppercase tracking-widest bg-gray-50 hover:bg-gray-100"
              id="toggle-validation-drawer-btn"
            >
              <span className="flex items-center space-x-2 font-bold text-gray-700">
                <Sliders size={14} />
                <span>Validator Results ({validationResults.length})</span>
              </span>
              <ChevronRight size={14} className={`transform transition-transform ${showValidationPanel ? "rotate-90" : ""}`} />
            </button>

            {showValidationPanel && (
              <div className="h-64 overflow-y-auto border-t bg-white" style={{ borderColor: designSystem.colors.borderLight }} id="drawer-inner-scroller">
                {validationResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 font-mono text-xs">
                    <CheckCircle className="mx-auto mb-2 text-emerald-500" size={18} />
                    <p>通过所有验证！系统架构规则无报错提示。</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100" id="validation-issues-list">
                    {validationResults.map((v, i) => {
                      const isError = v.severity === "error";
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            // Highlight the offending entities!
                            setHighlightedEntities(v.entities);
                            // If first entity is a node, center view or select it
                            if (v.entities.length > 0) {
                              const n = project.nodes.find((nd) => nd.id === v.entities[0]);
                              if (n) {
                                setSelectedNodeId(n.id);
                                setSelectedConnectionId(null);
                              }
                            }
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-purple-50 ${
                            isError ? "border-l-4 border-l-red-600" : "border-l-4 border-l-amber-500"
                          }`}
                          id={`validation-item-${i}`}
                        >
                          <div className="flex items-center space-x-1.5 font-mono text-[10px] font-bold">
                            {isError ? (
                              <X size={12} className="text-red-600 shrink-0" />
                            ) : (
                              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                            )}
                            <span className={isError ? "text-red-700" : "text-amber-700"}>
                              {v.rule.toUpperCase()}
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-500 capitalize">{v.severity}</span>
                          </div>

                          <p className="font-mono text-xs text-gray-900 mt-1.5 leading-relaxed font-bold">
                            {v.message}
                          </p>

                          {v.suggestion && (
                            <p className="font-mono text-[10px] text-gray-500 mt-1 bg-gray-50 p-1.5 border border-gray-100 leading-normal">
                              <strong>建议: </strong> {v.suggestion}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RAW COPIABLE YAML EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" id="export-backdrop">
          <div
            className="w-full max-w-3xl bg-white border-2 overflow-hidden shadow-2xl animate-scale-up"
            style={{ borderColor: designSystem.colors.borderDark }}
            id="export-modal-content"
          >
            {/* Top header rainbow stripe */}
            <RainbowStrip height="8px" />

            <div className="p-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                <h3 className="text-lg font-bold font-courier uppercase tracking-tight flex items-center space-x-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Schema Export Result / 架构模型导出</span>
                </h3>
                <span className="font-mono text-[10px] uppercase text-gray-500 px-2 py-0.5 border border-gray-200">
                  Format: {exportFormat.toUpperCase()}
                </span>
              </div>

              <textarea
                rows={14}
                readOnly
                value={exportedText}
                className="w-full p-4 border font-mono text-xs outline-none bg-gray-950 text-emerald-400 resize-none leading-relaxed overflow-y-auto rounded-none"
                style={{ borderColor: designSystem.colors.borderDark }}
                id="exported-text-area"
              />

              <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                <p className="font-mono text-[10px] text-gray-400">
                  * 复制此 YAML 后可在项目的 .terra.yaml 中提交纳入 Git 进行架构版本管理
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 border font-mono text-xs uppercase tracking-wider hover:bg-gray-50 font-bold"
                    style={{ borderColor: designSystem.colors.outlineVariant }}
                    id="export-close-btn"
                  >
                    Close
                  </button>
                  <button
                    onClick={copyExportToClipboard}
                    className="px-5 py-2 bg-black text-white hover:bg-gray-800 font-mono text-xs uppercase tracking-wider font-bold"
                    id="export-copy-btn"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== NODE INSPECTOR SUB-COMPONENT ====================

interface NodeInspectorProps {
  node: Node;
  onUpdate: (id: string, label: string, description: string | null, properties: any) => void;
  onDelete: () => void;
  onLink: () => void;
}

function NodeInspector({ node, onUpdate, onDelete, onLink }: NodeInspectorProps) {
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(node.description || "");
  const [techStack, setTechStack] = useState(node.properties?.tech_stack || node.properties?.engine || "");

  // Refresh properties when node changes
  useEffect(() => {
    setLabel(node.label);
    setDescription(node.description || "");
    setTechStack(node.properties?.tech_stack || node.properties?.engine || "");
  }, [node]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const props: any = {};
    if (node.type === "database" || node.type === "cache") {
      props.engine = techStack;
    } else {
      props.tech_stack = techStack;
    }
    onUpdate(node.id, label, description, props);
    alert("节点属性已更新并同步到服务端！");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4" id="node-inspector-form">
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">
          Node UUID (Readonly)
        </label>
        <input
          type="text"
          readOnly
          value={node.id}
          className="w-full p-2 border font-mono text-[11px] bg-gray-50 text-gray-400 outline-none cursor-not-allowed"
          style={{ borderColor: designSystem.colors.outlineVariant }}
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">
          Type / 节点类型 (Readonly)
        </label>
        <input
          type="text"
          readOnly
          value={node.type.toUpperCase()}
          className="w-full p-2 border font-mono text-[11px] bg-purple-50 text-purple-900 font-bold outline-none cursor-not-allowed uppercase"
          style={{ borderColor: designSystem.colors.outlineVariant }}
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Label / 节点名称 *
        </label>
        <input
          type="text"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full p-2 border font-mono text-xs outline-none focus:border-black"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="node-input-label"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Tech Stack / 引擎技术
        </label>
        <input
          type="text"
          placeholder="e.g. PostgreSQL, Redis, Kafka, Kong"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          className="w-full p-2 border font-mono text-xs outline-none focus:border-black"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="node-input-tech"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Description / 描述
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border font-mono text-xs outline-none focus:border-black resize-none"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="node-textarea-desc"
        />
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-2">
        <button
          type="submit"
          className="w-full py-2 bg-black text-white hover:bg-gray-800 font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-1"
          id="btn-save-node-properties"
        >
          <Save size={12} />
          <span>Save Changes</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onLink}
            className="py-1.5 border border-purple-300 text-purple-900 hover:bg-purple-50 font-mono text-[10px] font-bold uppercase tracking-wider"
            id="btn-node-link-shortcut"
          >
            Create Link (L)
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-mono text-[10px] font-bold uppercase tracking-wider"
            id="btn-node-delete-shortcut"
          >
            Delete Node
          </button>
        </div>
      </div>
    </form>
  );
}

// ==================== CONNECTION INSPECTOR SUB-COMPONENT ====================

interface ConnectionInspectorProps {
  connection: Connection;
  nodes: Node[];
  onUpdate: (
    id: string,
    mode: CommunicationMode,
    protocol: ProtocolType,
    description: string | null,
    format: string,
    inlineSchema: string
  ) => void;
  onDelete: () => void;
}

function ConnectionInspector({ connection, nodes, onUpdate, onDelete }: ConnectionInspectorProps) {
  const [mode, setMode] = useState<CommunicationMode>(connection.mode);
  const [protocol, setProtocol] = useState<ProtocolType>(connection.protocol);
  const [description, setDescription] = useState(connection.description || "");
  const [schemaFormat, setSchemaFormat] = useState(connection.data_carrier?.format || "");
  const [schemaJsonText, setSchemaJsonText] = useState(
    connection.data_carrier?.inline_schema
      ? JSON.stringify(connection.data_carrier.inline_schema, null, 2)
      : ""
  );

  const sourceNode = nodes.find((n) => n.id === connection.source_node_id);
  const targetNode = nodes.find((n) => n.id === connection.target_node_id);

  useEffect(() => {
    setMode(connection.mode);
    setProtocol(connection.protocol);
    setDescription(connection.description || "");
    setSchemaFormat(connection.data_carrier?.format || "");
    setSchemaJsonText(
      connection.data_carrier?.inline_schema
        ? JSON.stringify(connection.data_carrier.inline_schema, null, 2)
        : ""
    );
  }, [connection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(connection.id, mode, protocol, description, schemaFormat, schemaJsonText);
    alert("调用链路属性已同步保存到服务端！");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 font-mono text-xs" id="conn-inspector-form">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
          Source Node / 起始模块
        </label>
        <span className="block p-2 border font-bold bg-gray-50 text-gray-700">
          {sourceNode ? `${sourceNode.label} (${sourceNode.type})` : "未知节点"}
        </span>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
          Target Node / 调用目标
        </label>
        <span className="block p-2 border font-bold bg-gray-50 text-gray-700">
          {targetNode ? `${targetNode.label} (${targetNode.type})` : "未知节点"}
        </span>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Communication Mode / 通信模式 *
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as CommunicationMode)}
          className="w-full p-2 border bg-white focus:border-black font-mono text-xs"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="conn-select-mode"
        >
          <option value="sync_request_response">sync_request_response (同步应答)</option>
          <option value="async_message">async_message (异步单向)</option>
          <option value="one_way_notification">one_way_notification (单向通知)</option>
          <option value="publish_subscribe">publish_subscribe (发布/订阅)</option>
          <option value="event_broadcast">event_broadcast (事件广播)</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Protocol / 连接协议 *
        </label>
        <select
          value={protocol}
          onChange={(e) => setProtocol(e.target.value as ProtocolType)}
          className="w-full p-2 border bg-white focus:border-black font-mono text-xs"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="conn-select-protocol"
        >
          <option value="http_rest">http_rest (RESTful API)</option>
          <option value="grpc">grpc (gRPC)</option>
          <option value="graphql">graphql (GraphQL)</option>
          <option value="websocket">websocket (长连接)</option>
          <option value="amqp">amqp (RabbitMQ)</option>
          <option value="kafka">kafka (Kafka)</option>
          <option value="database">database (SQL/TCP)</option>
          <option value="custom">custom (自定义协议)</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Data Format / 载体结构格式
        </label>
        <input
          type="text"
          placeholder="e.g. json_schema, protobuf, custom"
          value={schemaFormat}
          onChange={(e) => setSchemaFormat(e.target.value)}
          className="w-full p-2 border bg-white focus:border-black font-mono text-xs"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="conn-input-format"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Inline Schema / 传输模型JSON (Optional)
        </label>
        <textarea
          rows={4}
          placeholder='{"type": "object", "properties": { "id": { "type": "string" } }}'
          value={schemaJsonText}
          onChange={(e) => setSchemaJsonText(e.target.value)}
          className="w-full p-2 border bg-white focus:border-black font-mono text-[10px] resize-none"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="conn-textarea-schema"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
          Description / 链路描述
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border bg-white focus:border-black font-mono text-xs resize-none"
          style={{ borderColor: designSystem.colors.outlineVariant }}
          id="conn-textarea-desc"
        />
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-2">
        <button
          type="submit"
          className="w-full py-2 bg-black text-white hover:bg-gray-800 font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-1"
          id="btn-save-conn-properties"
        >
          <Save size={12} />
          <span>Save Connection</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="w-full py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-mono text-[10px] font-bold uppercase tracking-wider"
          id="btn-conn-delete"
        >
          Delete Connection Link
        </button>
      </div>
    </form>
  );
}
