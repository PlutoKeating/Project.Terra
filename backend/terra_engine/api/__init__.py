from terra_engine.models.project import Project


class ProjectCreateRequest(Project):
    yaml_content: str | None = None
