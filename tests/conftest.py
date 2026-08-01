import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "core"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@pytest.fixture(autouse=True)
def supabase_memory_store(monkeypatch):
    from terra_engine.services import supabase_service

    documents = {}
    monkeypatch.setattr(supabase_service, "get", lambda project_id: documents.get(project_id))
    monkeypatch.setattr(supabase_service, "list_all", lambda: list(documents.values()))
    monkeypatch.setattr(
        supabase_service,
        "save",
        lambda document: documents.__setitem__(document["project"]["id"], document),
    )
    monkeypatch.setattr(supabase_service, "delete", lambda project_id: documents.pop(project_id, None))
    return documents
