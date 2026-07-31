import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def enabled() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def _request(method: str, path: str, payload=None):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    headers = {
        "apikey": os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": "Bearer " + os.environ["SUPABASE_SERVICE_ROLE_KEY"],
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
    _request("POST", "terra_projects", {"id": project["id"], "name": project["name"], "document": project})


def delete(project_id: str):
    _request("DELETE", f"terra_projects?id=eq.{project_id}")
