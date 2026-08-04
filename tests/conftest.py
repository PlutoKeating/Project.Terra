import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "core"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@pytest.fixture(autouse=True)
def supabase_memory_store(monkeypatch):
    from terra_engine.services import supabase_service

    documents = {}

    def get(project_id, owner_id=None):
        record = documents.get(project_id)
        if not record or (owner_id and record["owner_id"] != owner_id):
            return None
        return record["document"]

    def list_all(owner_id=None):
        return [
            record["document"] for record in documents.values()
            if not owner_id or record["owner_id"] == owner_id
        ]

    def save(document, owner_id=None):
        documents[document["project"]["id"]] = {"owner_id": owner_id, "document": document}

    def delete(project_id, owner_id=None):
        record = documents.get(project_id)
        if record and (not owner_id or record["owner_id"] == owner_id):
            documents.pop(project_id)

    monkeypatch.setattr(supabase_service, "get", get)
    monkeypatch.setattr(supabase_service, "list_all", list_all)
    monkeypatch.setattr(supabase_service, "save", save)
    monkeypatch.setattr(supabase_service, "delete", delete)
    return documents
