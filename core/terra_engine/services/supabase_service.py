import json
import os
from urllib.parse import quote
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def _settings() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return url.rstrip("/"), service_role_key


def _request(method: str, path: str, payload=None):
    base_url, service_role_key = _settings()
    url = base_url + "/rest/v1/" + path
    headers = {
        "apikey": service_role_key,
        "Authorization": "Bearer " + service_role_key,
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }
    body = json.dumps(payload).encode() if payload is not None else None
    try:
        with urlopen(Request(url, data=body, headers=headers, method=method), timeout=8) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except HTTPError as exc:
        raise RuntimeError(f"Supabase request failed: {exc.code}") from exc


def _owner_filter(owner_id: str | None) -> str:
    return f"&owner_id=eq.{quote(owner_id)}" if owner_id else ""


def get(project_id: str, owner_id: str | None = None):
    rows = _request("GET", f"terra_projects?id=eq.{quote(project_id)}{_owner_filter(owner_id)}&select=document")
    return rows[0]["document"] if rows else None


def list_all(owner_id: str | None = None):
    rows = _request("GET", f"terra_projects?select=document{_owner_filter(owner_id)}&order=updated_at.desc")
    return [row["document"] for row in rows or []]


def save(project: dict, owner_id: str | None = None):
    identity = project["project"]
    payload = {"id": identity["id"], "name": identity["name"], "document": project}
    if owner_id:
        payload["owner_id"] = owner_id
    _request("POST", "terra_projects", payload)


def delete(project_id: str, owner_id: str | None = None):
    _request("DELETE", f"terra_projects?id=eq.{quote(project_id)}{_owner_filter(owner_id)}")
