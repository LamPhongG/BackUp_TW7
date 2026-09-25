"""Pipeline 2 (thuần Python): Coverage Score theo Role Requirement Matrix và kiểm tra tiên quyết.

Owner: Đoàn Thị Quỳnh Nhi. Không được import bất kỳ AI SDK nào (Rules section 3).
"""
from app.rule_pipeline.coverage import compute_coverage, required_documents, score_requirements

__all__ = ["compute_coverage", "required_documents", "score_requirements"]
