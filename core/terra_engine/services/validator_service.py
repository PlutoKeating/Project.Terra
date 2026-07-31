from terra_engine.models.project import Project
from terra_engine.models.validation import ValidationResult
from terra_engine.validators.cycle_detector import check_cycles
from terra_engine.validators.orphan_detector import check_orphans
from terra_engine.validators.completeness_checker import check_completeness
from terra_engine.validators.protocol_consistency import check_protocol_consistency


_RULES = [check_cycles, check_orphans, check_completeness, check_protocol_consistency]


def validate_project(project: Project) -> list[ValidationResult]:
    results: list[ValidationResult] = []
    for rule in _RULES:
        results.extend(rule(project))
    return results
