import json
import os
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


def get(project_id: str):
    rows = _request("GET", f"terra_projects?id=eq.{project_id}&select=document")
    return rows[0]["document"] if rows else None


def list_all():
    rows = _request("GET", "terra_projects?select=document&order=updated_at.desc")
    return [row["document"] for row in rows or []]


def save(project: dict):
    identity = project["project"]
    _request("POST", "terra_projects", {"id": identity["id"], "name": identity["name"], "document": project})


def delete(project_id: str):
    _request("DELETE", f"terra_projects?id=eq.{project_id}")
