import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trash2, AlertCircle, Plus, Upload, Code, BookOpen, ExternalLink, Activity } from "lucide-react";
import { designSystem } from "../designSystem";
import { Project } from "../types";
import RainbowStrip from "../components/RainbowStrip";
import { apiFetch } from "../apiFetch";

// Fallback images matching 80s tactile computing nostalgia
const RETRO_IMAGES = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop", // Retro chip
  "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop", // Mechanical keyboard switch
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop", // Technical routing system
  "https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=600&auto=format&fit=crop", // IBM mainframe layout
];

export default function ProjectsPage() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [creationMode, setCreationMode] = useState<"blank" | "yaml">("blank");
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [yamlContent, setYamlContent] = useState("");
  const [createAsActive, setCreateAsActive] = useState(true);

  // Delete Confirmation State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();
  const visibleProjects = searchQuery
    ? projects.filter((project) => `${project.name} ${project.description || ""}`.toLowerCase().includes(searchQuery))
    : projects;

  // Fetch projects from the Vercel Serverless API.
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/v1/projects");
      if (!res.ok) throw new Error("无法拉取项目列表，请确保后端服务在线。");
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "拉取数据出错");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Create Project Action
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationMode === "blank" && !projectName.trim()) {
      alert("请输入项目名称");
      return;
    }
    if (creationMode === "yaml" && !yamlContent.trim()) {
      alert("请粘贴合法的 YAML 格式内容");
      return;
    }

    try {
      const payload: any = {
        metadata: {
          isActiveWorkspace: createAsActive,
        },
      };
      if (creationMode === "blank") {
        payload.name = projectName;
        payload.description = projectDesc;
      } else {
        payload.yaml_content = yamlContent;
      }

      const res = await apiFetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "创建项目失败");
      }

      // Close modal & reset fields
      setShowNewModal(false);
      setProjectName("");
      setProjectDesc("");
      setYamlContent("");
      setCreationMode("blank");
      setCreateAsActive(true);

      // Reload
      fetchProjects();
    } catch (err: any) {
      alert("创建失败: " + err.message);
    }
  };

  // Toggle Project Active / Archieved state
  const handleToggleWorkspaceStatus = async (project: Project, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const currentStatus = project.metadata?.isActiveWorkspace === true;
      const updatedMetadata = {
        ...(project.metadata || {}),
        isActiveWorkspace: !currentStatus,
      };

      const res = await apiFetch(`/api/v1/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: updatedMetadata,
        }),
      });

      if (!res.ok) throw new Error("更新项目状态失败");

      // Reload list
      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Project Action
  const handleDeleteProject = async (id: string) => {
    try {
      const res = await apiFetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除项目失败");
      setProjectToDelete(null);
      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Preset Template YAML to populate for quick user testing
  const populateTemplateYAML = () => {
    setYamlContent(`project:
  name: Imported Gateway Engine
  description: 智能微服务网关以及路由代理系统设计
  version: 1.0.0
nodes:
  - id: gateway-node
    type: service
    label: Edge Router Gateway
    description: 统一边缘网关，JWT授权校验
    properties:
      tech_stack: APISIX
  - id: user-service-node
    type: service
    label: User Account Service
    description: 用户元数据存储微服务
    properties:
      tech_stack: Spring Boot
  - id: cache-service-node
    type: cache
    label: Token Store Redis
    description: 高并发缓存中心
    properties:
      engine: Redis
      version: 7.0
connections:
  - source_node_id: gateway-node
    target_node_id: user-service-node
    mode: sync_request_response
    protocol: http_rest
    description: 网关透传请求
  - source_node_id: user-service-node
    target_node_id: cache-service-node
    mode: sync_request_response
    protocol: database
    description: 读取会话缓存
node_positions:
  gateway-node:
    x: 180
    y: 150
  user-service-node:
    x: 480
    y: 150
  cache-service-node:
    x: 480
    y: 360`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10" id="projects-dashboard-page">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200" id="dashboard-header-block">
        <div>
          <h1 className="text-4xl font-bold font-courier tracking-tight uppercase" style={{ color: designSystem.colors.onSurface }}>
            Projects Dashboard
          </h1>
          <p className="font-mono text-xs text-gray-500 uppercase mt-2 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terminal Session: Active // Node-08F-X
          </p>
        </div>

        {/* New Project trigger button */}
        <button
          onClick={() => {
            setShowNewModal(true);
            setCreationMode("blank");
          }}
          className="relative mt-4 md:mt-0 px-6 py-3 border font-mono text-xs font-bold uppercase tracking-wider bg-white transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer group"
          style={{ borderColor: designSystem.colors.borderDark }}
          id="btn-trigger-new-project"
        >
          <div className="flex items-center space-x-2">
            <Plus size={14} />
            <span>New Project</span>
          </div>
          {/* Classic computer rainbow stripe at the bottom */}
          <div className="absolute left-0 right-0 bottom-0 h-[4px] overflow-hidden">
            <RainbowStrip height="4px" />
          </div>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center font-mono text-xs tracking-widest text-gray-500" id="dashboard-loading-state">
          [ LOADING WORKSPACE METADATA... ]
        </div>
      )}

      {error && (
        <div
          className="p-4 border border-rose-200 bg-rose-50 flex items-start gap-3 mb-8"
          style={{ color: designSystem.colors.error }}
          id="dashboard-error-state"
        >
          <AlertCircle className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold font-courier">连接失败</h3>
            <p className="font-mono text-xs mt-1">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-3 px-3 py-1 border text-xs font-mono font-bold bg-white uppercase tracking-wider hover:bg-gray-100"
              style={{ borderColor: designSystem.colors.error }}
            >
              重试链接
            </button>
          </div>
        </div>
      )}

      {/* Primary Content Grid */}
      {!loading && !error && (
        <div className="space-y-12" id="dashboard-primary-container">
          
          {visibleProjects.length === 0 ? (
            // Empty State
            <div
              className="p-12 text-center border-2 border-dashed bg-white flex flex-col items-center justify-center py-20"
              style={{ borderColor: designSystem.colors.outlineVariant }}
              id="dashboard-empty-state"
            >
              <Code className="text-gray-300 w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold font-courier">尚无任何架构项目</h3>
              <p className="font-mono text-xs text-gray-500 max-w-md mx-auto mt-2">
                {searchQuery ? `没有匹配 “${searchParams.get("q") || ""}” 的项目。` : "你可以通过空白面板创建全新的拓扑规划，或者直接导入现有的 .terra.yaml 设计文件。"}
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowNewModal(true);
                    setCreationMode("blank");
                  }}
                  className="px-4 py-2 border font-mono text-xs uppercase font-bold tracking-widest bg-black text-white hover:bg-gray-800"
                  id="empty-create-blank"
                >
                  创建空白画布
                </button>
                <button
                  onClick={() => {
                    setShowNewModal(true);
                    setCreationMode("yaml");
                  }}
                  className="px-4 py-2 border font-mono text-xs uppercase font-bold tracking-widest bg-white hover:bg-gray-50 text-gray-800"
                  style={{ borderColor: designSystem.colors.borderDark }}
                  id="empty-create-yaml"
                >
                  导入 YAML 文本
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Row Grid: Active Workspaces + Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-top-row-grid">
                
                {/* Left Large Column: Active Workspaces List */}
                <div className="lg:col-span-2 space-y-6" id="dashboard-featured-column">
                  {/* Partition projects into Active and Archieved lists */}
                  {(() => {
                    const activeProjects = visibleProjects.filter((p) => p.metadata?.isActiveWorkspace === true);
                    return activeProjects.length > 0 ? (
                      activeProjects.map((proj, idx) => {
                        const randomImg = RETRO_IMAGES[idx % RETRO_IMAGES.length];
                        return (
                          <div
                            key={proj.id}
                            className="relative border bg-white overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                            style={{ borderColor: designSystem.colors.borderDark }}
                            id={`featured-project-container-${proj.id}`}
                          >
                            {/* Rainbow stripe banner on top of the card */}
                            <RainbowStrip height="8px" />

                            <div className="p-8 flex flex-col md:flex-row gap-8 justify-between items-stretch flex-1">
                              <div className="flex-1 flex flex-col justify-between" id={`featured-info-${proj.id}`}>
                                <div>
                                  <h2 className="text-2xl font-bold font-courier mt-4 mb-2" style={{ color: designSystem.colors.onSurface }}>
                                    {proj.name}
                                  </h2>
                                  <p className="text-gray-500 font-mono text-xs line-clamp-3 mb-6">
                                    {proj.description || "该架构尚无详细说明，点击进入可以自定义添加组件依赖关系以及通信链路。"}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100" id={`featured-stats-${proj.id}`}>
                                  <div>
                                    <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Topology Nodes</span>
                                    <span className="text-lg font-bold font-mono text-gray-800">
                                      {proj.nodes?.length || 0} Nodes
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">Version State</span>
                                    <span className="text-lg font-bold font-mono text-emerald-700">
                                      v{proj.version || "0.1.0"}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-8 flex items-center space-x-4">
                                  <Link
                                    to={`/projects/${proj.id}`}
                                    className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-2"
                                    id={`featured-enter-canvas-link-${proj.id}`}
                                  >
                                    <span>Enter Workspace</span>
                                    <ExternalLink size={12} />
                                  </Link>

                                  <button
                                    onClick={(e) => handleToggleWorkspaceStatus(proj, e)}
                                    className="group font-mono text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer px-4 py-2.5 border rounded-none bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-amber-500 hover:border-amber-500 hover:text-white shadow-sm"
                                    title="Click to move to Archieved Workspaces"
                                  >
                                    {/* Default State: ACTIVE */}
                                    <span className="inline-flex items-center gap-1.5 group-hover:hidden">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Active
                                    </span>
                                    {/* Hover State: ARCHIEVE */}
                                    <span className="hidden group-hover:inline-flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                      Archieve
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => setProjectToDelete(proj)}
                                    className="p-2.5 border text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                                    style={{ borderColor: designSystem.colors.borderLight }}
                                    title="Delete Project"
                                    id={`featured-delete-btn-${proj.id}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Isometric Retro Computing Mock Drawing on right side */}
                              <div className="w-full md:w-[260px] h-[220px] shrink-0 border relative bg-gray-50 overflow-hidden md:self-center" style={{ borderColor: designSystem.colors.borderLight }}>
                                <img
                                  src={randomImg}
                                  alt="Featured blueprint"
                                  className="w-full h-full object-cover grayscale contrast-125 brightness-95 opacity-85"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-white/90 border px-1.5 py-0.5 text-gray-600">
                                  DIAGRAM_{idx.toString().padStart(2, "0")}.RAW
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className="border border-dashed p-8 bg-gray-50/50 flex flex-col items-center justify-center text-center h-full min-h-[260px]"
                        style={{ borderColor: designSystem.colors.outlineVariant }}
                        id="no-active-workspaces-placeholder"
                      >
                        <Activity size={24} className="text-gray-400 mb-3" />
                        <h4 className="font-courier font-bold text-sm text-gray-700">暂无活跃工作区 / No Active Workspaces</h4>
                        <p className="font-mono text-[11px] text-gray-500 mt-1 max-w-sm">
                          活跃工作区为空。您可以在下方 “Archieved Workspaces” 中，通过卡片上的状态切换按钮将任意架构项目标记为活跃。
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Right Column: Activity Metrics / Specs Panel */}
                <div className="lg:col-span-1 space-y-8" id="dashboard-sidebar-column">
                  
                  {/* System Info Stats Block */}
                  <div
                    className="border bg-white p-6 relative overflow-hidden h-full flex flex-col justify-between"
                    style={{ borderColor: designSystem.colors.borderDark }}
                    id="sidebar-metrics-container"
                  >
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                        <Activity size={14} className="text-purple-700 animate-pulse" />
                        Activity Metrics
                      </h4>

                      <div className="space-y-4" id="sidebar-specs-list">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Sync Status</span>
                          <span className="font-mono text-xs font-bold text-emerald-600">CONNECTED</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">API Server</span>
                          <span className="font-mono text-xs font-bold text-gray-800">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Project Volume</span>
                          <span className="font-mono text-xs font-bold text-gray-800">{projects.length} Total</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Engine Load</span>
                          <span className="font-mono text-xs font-bold text-gray-800">12% Idle</span>
                        </div>
                      </div>
                    </div>

                    {/* Aesthetic subtle color dots block */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2" id="sidebar-deco-dots">
                      <div className="w-2.5 h-2.5 bg-green-500"></div>
                      <div className="w-2.5 h-2.5 bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 bg-orange-500"></div>
                      <div className="w-2.5 h-2.5 bg-red-500"></div>
                      <div className="w-2.5 h-2.5 bg-purple-500"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500"></div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest ml-2">SYSTEM_CHASSIS_STABLE</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Sub projects list (Grid) spanning full container width with dynamic responsive adaptive columns */}
              {(() => {
                const storedProjects = visibleProjects.filter((p) => p.metadata?.isActiveWorkspace !== true);
                return (
                  <div className="w-full pt-4" id="stored-architectures-section">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-6 font-bold">
                      Archieved Workspaces ({storedProjects.length})
                    </h3>
                    {storedProjects.length > 0 ? (
                      <div
                        className={`grid gap-8 ${
                          storedProjects.length === 1
                            ? "grid-cols-1"
                            : storedProjects.length === 2
                            ? "grid-cols-1 sm:grid-cols-2"
                            : storedProjects.length === 3
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : storedProjects.length === 4
                            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        }`}
                        id="sub-projects-grid"
                      >
                        {storedProjects.map((proj, idx) => {
                          const randomImg = RETRO_IMAGES[(idx + 1) % RETRO_IMAGES.length];
                          return (
                            <div
                              key={proj.id}
                              className="border bg-white overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md"
                              style={{ borderColor: designSystem.colors.borderLight }}
                              id={`project-card-${proj.id}`}
                            >
                              {/* Graphic Top banner */}
                              <div className="h-[120px] relative bg-gray-100 overflow-hidden border-b" style={{ borderColor: designSystem.colors.borderLight }}>
                                <img
                                  src={randomImg}
                                  alt="Project banner"
                                  className="w-full h-full object-cover grayscale contrast-110 opacity-75"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-2 left-2 font-mono text-[9px] bg-black text-white px-2 py-0.5 uppercase tracking-widest">
                                  v{proj.version || "0.1.0"}
                                </div>

                                <button
                                  onClick={(e) => handleToggleWorkspaceStatus(proj, e)}
                                  className="group absolute top-2 right-2 z-30 font-mono text-[10px] uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center cursor-pointer shadow-md rounded-none border px-3.5 py-1.5 bg-amber-50 border-amber-200 text-amber-700 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                                  title="Click to set as Active Workspace"
                                >
                                  {/* Default State: ARCHIEVED */}
                                  <span className="inline-flex items-center gap-1.5 group-hover:hidden">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    Archieved
                                  </span>
                                  {/* Hover State: ACTIVATE */}
                                  <span className="hidden group-hover:inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    Activate
                                  </span>
                                </button>
                              </div>

                              {/* Body */}
                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-lg font-bold font-courier line-clamp-1" style={{ color: designSystem.colors.onSurface }}>
                                    {proj.name}
                                  </h4>
                                  <p className="text-gray-400 font-mono text-xs line-clamp-2 mt-2">
                                    {proj.description || "暂无描述信息。"}
                                  </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between font-mono text-[10px] text-gray-500">
                                  <span>{proj.nodes?.length || 0} Nodes</span>
                                  <span>{proj.connections?.length || 0} Links</span>
                                </div>

                                <div className="mt-5 flex items-center justify-between">
                                  <Link
                                    to={`/projects/${proj.id}`}
                                    className="text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 hover:underline"
                                    style={{ color: designSystem.colors.primary }}
                                    id={`enter-project-${proj.id}`}
                                  >
                                    <span>View Canvas</span>
                                    <ExternalLink size={10} />
                                  </Link>

                                  <button
                                    onClick={() => setProjectToDelete(proj)}
                                    className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete Design"
                                    id={`delete-project-${proj.id}`}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="border border-dashed p-8 bg-gray-50/50 flex flex-col items-center justify-center text-center py-12"
                        style={{ borderColor: designSystem.colors.outlineVariant }}
                        id="no-stored-projects-placeholder"
                      >
                        <BookOpen size={20} className="text-gray-400 mb-2" />
                        <h4 className="font-courier font-bold text-xs text-gray-700">尚无任何存档的工作区 (Archieved Workspaces)</h4>
                        <p className="font-mono text-[10px] text-gray-400 mt-1 max-w-sm">
                          您可以点击活跃工作区卡片上的状态标签，将其移动至存档列表中。
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* NEW PROJECT DIALOG (Modal) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" id="modal-container-backdrop">
          <div
            className="w-full max-w-2xl bg-white border-2 overflow-hidden shadow-2xl animate-scale-up"
            style={{ borderColor: designSystem.colors.borderDark }}
            id="modal-content"
          >
            {/* Header Banner */}
            <RainbowStrip height="8px" />

            <div className="p-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
                <h3 className="text-xl font-bold font-courier uppercase tracking-tight">
                  {creationMode === "blank" ? "Create New Workspace" : "Import Architectural Model"}
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="font-mono text-xs uppercase border px-2 py-1 hover:bg-gray-100 font-bold"
                  id="modal-close-btn"
                >
                  ESC / Cancel
                </button>
              </div>

              {/* Mode Toggles */}
              <div className="flex border-b border-gray-200 mb-6" id="modal-tab-toggles">
                <button
                  type="button"
                  onClick={() => setCreationMode("blank")}
                  className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-r border-t border-l transition-colors flex items-center justify-center space-x-2 ${
                    creationMode === "blank"
                      ? "bg-purple-50 text-purple-950 border-gray-300"
                      : "text-gray-400 border-transparent bg-gray-50/50"
                  }`}
                  id="tab-toggle-blank"
                >
                  <Plus size={14} />
                  <span>Blank Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode("yaml")}
                  className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-r border-t border-l transition-colors flex items-center justify-center space-x-2 ${
                    creationMode === "yaml"
                      ? "bg-purple-50 text-purple-950 border-gray-300"
                      : "text-gray-400 border-transparent bg-gray-50/50"
                  }`}
                  id="tab-toggle-yaml"
                >
                  <Upload size={14} />
                  <span>YAML Schema Import</span>
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4" id="new-project-form">
                {creationMode === "blank" ? (
                  <>
                    <div id="form-group-name">
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                        Project Name / 拓扑项目名称 *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Order Dispatch Engine"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full p-2.5 border font-mono text-xs outline-none focus:border-black bg-gray-50/50"
                        style={{ borderColor: designSystem.colors.outlineVariant }}
                        id="input-project-name"
                      />
                    </div>

                    <div id="form-group-desc">
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                        Description / 项目业务描述 (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Core ordering and message dispatch system design."
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        className="w-full p-2.5 border font-mono text-xs outline-none focus:border-black bg-gray-50/50 resize-none"
                        style={{ borderColor: designSystem.colors.outlineVariant }}
                        id="textarea-project-desc"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-500">
                        Paste .terra.yaml Specs / 粘贴架构拓扑文本
                      </label>
                      <button
                        type="button"
                        onClick={populateTemplateYAML}
                        className="text-[10px] font-mono text-purple-700 underline font-bold hover:text-purple-900"
                      >
                        [ Load Demo Template ]
                      </button>
                    </div>
                    <textarea
                      rows={10}
                      required
                      placeholder="Paste your .terra.yaml layout specs..."
                      value={yamlContent}
                      onChange={(e) => setYamlContent(e.target.value)}
                      className="w-full p-3 border font-mono text-xs outline-none focus:border-black bg-gray-900 text-emerald-400 resize-none leading-relaxed"
                      style={{ borderColor: designSystem.colors.outlineVariant }}
                      id="textarea-yaml-content"
                    />
                    <p className="font-mono text-[10px] text-gray-400">
                      * 系统会自动解析 nodes / connections 列表并计算画布坐标位置
                    </p>
                  </>
                )}

                {/* Active Workspace Toggle option */}
                <div className="flex items-center space-x-2 py-2" id="form-group-active">
                  <input
                    type="checkbox"
                    id="checkbox-is-active"
                    checked={createAsActive}
                    onChange={(e) => setCreateAsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="checkbox-is-active" className="font-mono text-xs text-gray-700 cursor-pointer select-none">
                    Set as Active Workspace / 立即设为活跃工作区
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 border font-mono text-xs uppercase tracking-wider hover:bg-gray-50 font-bold"
                    style={{ borderColor: designSystem.colors.outlineVariant }}
                    id="modal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-black text-white hover:bg-gray-800 font-mono text-xs uppercase tracking-wider font-bold"
                    id="modal-submit-btn"
                  >
                    {creationMode === "blank" ? "Create Model" : "Begin Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (Modal) */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" id="delete-confirm-backdrop">
          <div
            className="w-full max-w-md bg-white border-2 overflow-hidden shadow-2xl animate-scale-up"
            style={{ borderColor: designSystem.colors.error }}
            id="delete-confirm-modal"
          >
            <div className="bg-rose-50 p-4 border-b flex items-center space-x-2" style={{ borderColor: designSystem.colors.errorContainer }}>
              <AlertCircle className="text-red-600 shrink-0" />
              <h3 className="font-courier font-bold text-red-950 uppercase text-sm tracking-wide">
                Warning: Irreversible Delete
              </h3>
            </div>

            <div className="p-6">
              <p className="font-mono text-xs text-gray-700 leading-relaxed">
                您即将删除项目 <strong className="text-black font-courier text-sm">“{projectToDelete.name}”</strong> 及其包含的所有拓扑节点、调用连线配置。此操作无法撤销。
              </p>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 border font-mono text-xs uppercase tracking-wider hover:bg-gray-50 font-bold"
                  style={{ borderColor: designSystem.colors.outlineVariant }}
                  id="delete-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(projectToDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-mono text-xs uppercase tracking-wider font-bold"
                  id="delete-confirm-btn"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
