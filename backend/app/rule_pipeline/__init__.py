"""Pipeline 2 (thuần Python): Coverage Score theo Role Requirement Matrix và kiểm tra tiên quyết.

Owner: Đoàn Thị Quỳnh Nhi. Không được import bất kỳ AI SDK nào (Rules section 3).
"""
from app.rule_pipeline.coverage import compute_coverage, keyword_topics, required_documents, score_requirements
from app.rule_pipeline.precedence import precedence_tier, resolve_precedence, sort_by_precedence
from app.rule_pipeline.weak_areas import analyze_weak_areas

__all__ = [
    "analyze_weak_areas",
    "compute_coverage",
    "keyword_topics",
    "precedence_tier",
    "required_documents",
    "resolve_precedence",
    "score_requirements",
    "sort_by_precedence",
]
