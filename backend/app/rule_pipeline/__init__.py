"""Pipeline 2 (thuần Python): quy tắc phân cấp tài liệu, kiểm tra tiên quyết, phát hiện điểm yếu.

Owner: Đoàn Thị Quỳnh Nhi. Không được import bất kỳ AI SDK nào (Rules section 3).

Coverage Score (SRS Steps 10, 28-30) nay được tính trong `app.services.role_matrix.compute_coverage`,
dùng dữ liệu Role Requirement Matrix thật của nhóm (bảng DB `RoleRequirement`, nhập từ
`role_matrix/role_matrix.csv`) thay cho CSV riêng từng dùng ở đây.
"""
from app.rule_pipeline.precedence import precedence_tier, resolve_precedence, sort_by_precedence
from app.rule_pipeline.weak_areas import analyze_weak_areas

__all__ = [
    "analyze_weak_areas",
    "precedence_tier",
    "resolve_precedence",
    "sort_by_precedence",
]
