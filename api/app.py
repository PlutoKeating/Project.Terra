import os
import sys
from pathlib import Path

import httpx
from flask import Flask, jsonify, request
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "core"))

from terra_engine.models.project import Connection, Node
from terra_engine.services import export_service, project_service, validator_service

app = Flask(__name__)


@app.errorhandler(RuntimeError)
def service_unavailable(exc):
    return jsonify(detail=str(exc)), 503


def auth_required():
    return os.getenv("SUPABASE_AUTH_REQUIRED", "false").lower() == "true"


def authorized():
    authorization = request.headers.get("Authorization", "")
    if not authorization.lower().startswith("bearer "):
        return False
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_ANON_KEY"):
        return False
    response = httpx.get(
        os.environ["SUPABASE_URL"].rstrip("/") + "/auth/v1/user",
        headers={"apikey": os.environ["SUPABASE_ANON_KEY"], "Authorization": authorization},
        timeout=5,
    )
    return response.is_success


@app.before_request
def protect_api():
    if auth_required() and request.path != "/api/v1/health" and not authorized():
        return jsonify(detail="Authentication required"), 401


def body(model):
    try:
        return model.model_validate(request.get_json(force=True)), None
    except (ValidationError, TypeError, ValueError) as exc:
        return None, (jsonify(detail=str(exc)), 422)


@app.get("/api/v1/health")
def health():
    return jsonify(status="ok")


@app.route("/api/v1/projects", methods=["GET", "POST"])
def projects():
    if request.method == "GET":
        return jsonify([p.model_dump(mode="json") for p in project_service.list_projects()])
    data = request.get_json(force=True) or {}
    try:
        project = project_service.create_project(data.get("name", ""), data.get("description"), data.get("yaml_content"), data.get("metadata"))
        return jsonify(project.model_dump(mode="json"))
    except (ValueError, TypeError, KeyError) as exc:
        return jsonify(detail=f"Invalid project YAML: {exc}"), 422


@app.route("/api/v1/projects/<project_id>", methods=["GET", "PUT", "DELETE"])
def project(project_id):
    current = project_service.get_project(project_id)
    if current is None:
        return jsonify(detail="Project not found"), 404
    if request.method == "GET":
        return jsonify(current.model_dump(mode="json"))
    if request.method == "DELETE":
        project_service.delete_project(project_id)
        return jsonify(status="deleted")
    data = request.get_json(force=True) or {}
    updated = project_service.update_project(project_id, data.get("name"), data.get("description"), data.get("metadata"))
    return jsonify(updated.model_dump(mode="json"))


@app.get("/api/v1/projects/<project_id>/export")
def export_project(project_id):
    current = project_service.get_project(project_id)
    if current is None:
        return jsonify(detail="Project not found"), 404
    format_name = request.args.get("format", "yaml")
    if format_name == "yaml":
        return jsonify(yaml=export_service.export_project_yaml(current))
    if format_name == "json":
        return jsonify(export_service.export_project_json(current))
    return jsonify(detail="format must be yaml or json"), 400


def collection(project_id, kind):
    current = project_service.get_project(project_id)
    if current is None:
        return jsonify(detail="Project not found"), 404
    model = Node if kind == "nodes" else Connection
    if request.method == "GET":
        values = current.nodes if kind == "nodes" else current.connections
        return jsonify([v.model_dump(mode="json") for v in values])
    value, error = body(model)
    if error:
        return error
    if kind == "connections":
        ids = {n.id for n in current.nodes}
        if value.source_node_id not in ids or value.target_node_id not in ids:
            return jsonify(detail="Connection references an unknown node"), 422
        updated = project_service.add_connection(project_id, value)
    else:
        updated = project_service.add_node(project_id, value)
    return jsonify((updated.connections if kind == "connections" else updated.nodes)[-1].model_dump(mode="json"))


@app.route("/api/v1/projects/<project_id>/nodes", methods=["GET", "POST"])
def nodes(project_id):
    return collection(project_id, "nodes")


@app.route("/api/v1/projects/<project_id>/connections", methods=["GET", "POST"])
def connections(project_id):
    return collection(project_id, "connections")


@app.route("/api/v1/projects/<project_id>/nodes/<node_id>", methods=["GET", "PUT", "DELETE"])
def node_item(project_id, node_id):
    current = project_service.get_project(project_id)
    if current is None:
        return jsonify(detail="Project not found"), 404
    existing = next((value for value in current.nodes if value.id == node_id), None)
    if existing is None:
        return jsonify(detail="Node not found"), 404
    if request.method == "GET":
        return jsonify(existing.model_dump(mode="json"))
    if request.method == "DELETE":
        project_service.delete_node(project_id, node_id)
        return jsonify(status="deleted")
    value, error = body(Node)
    if error:
        return error
    updated = project_service.update_node(project_id, node_id, value)
    return jsonify(next(value for value in updated.nodes if value.id == node_id).model_dump(mode="json"))


@app.route("/api/v1/projects/<project_id>/connections/<connection_id>", methods=["GET", "PUT", "DELETE"])
def connection_item(project_id, connection_id):
    current = project_service.get_project(project_id)
    if current is None:
        return jsonify(detail="Project not found"), 404
    existing = next((value for value in current.connections if value.id == connection_id), None)
    if existing is None:
        return jsonify(detail="Connection not found"), 404
    if request.method == "GET":
        return jsonify(existing.model_dump(mode="json"))
    if request.method == "DELETE":
        project_service.delete_connection(project_id, connection_id)
        return jsonify(status="deleted")
    value, error = body(Connection)
    if error:
        return error
    ids = {node.id for node in current.nodes}
    if value.source_node_id not in ids or value.target_node_id not in ids:
        return jsonify(detail="Connection references an unknown node"), 422
    updated = project_service.update_connection(project_id, connection_id, value)
    return jsonify(next(value for value in updated.connections if value.id == connection_id).model_dump(mode="json"))


@app.post("/api/v1/projects/<project_id>/validate")
def validate(project_id):
    current = project_service.get_project(project_id)
    if current is None:
        return jsonify(detail="Project not found"), 404
    return jsonify([v.model_dump(mode="json") for v in validator_service.validate_project(current)])
