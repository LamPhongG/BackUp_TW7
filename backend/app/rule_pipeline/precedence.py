"""Quy tắc phân cấp ưu tiên chính sách (Policy Precedence, SRS Step 34).

Thuần Python, không dùng AI SDK. Khi 2 tài liệu cùng liên quan đến một yêu cầu nhưng khác cấp bậc
hoặc khác version, hàm ở đây quyết định tài liệu nào có thẩm quyền cao hơn — không tự phát hiện
mâu thuẫn (đó là việc của kiểm tra trích dẫn ở path_checks.py), chỉ xếp hạng khi đã có ứng viên.
"""
from functools import cmp_to_key

from app.ingestion.validation import compare_versions
from app.models import Document

# Bậc 1 (cao nhất): chính sách toàn công ty. Bậc 2: quy trình/mô tả theo phòng ban. Bậc 3: FAQ
# (hướng dẫn không chính thức). Khớp với MANDATORY_CATEGORIES ở coverage.py; category lạ (vd
# "Test Case") rơi vào bậc thấp nhất, không có tiếng nói khi so ưu tiên.
PRECEDENCE_TIER = {
    "Handbook": 1,
    "Policy": 1,
    "Compliance": 1,
    "SOP": 2,
    "Process Manual": 2,
    "Role Description": 2,
    "FAQ": 3,
}
_LOWEST_TIER = max(PRECEDENCE_TIER.values()) + 1


def precedence_tier(document: Document) -> int:
    return PRECEDENCE_TIER.get(document.category, _LOWEST_TIER)


def resolve_precedence(doc_a: Document, doc_b: Document) -> Document:
    """Tài liệu cấp bậc cao hơn (số bậc nhỏ hơn) thắng; cùng bậc thì version mới hơn thắng."""
    tier_a, tier_b = precedence_tier(doc_a), precedence_tier(doc_b)
    if tier_a != tier_b:
        return doc_a if tier_a < tier_b else doc_b
    return doc_a if compare_versions(doc_a.version, doc_b.version) >= 0 else doc_b


def _compare(doc_a: Document, doc_b: Document) -> int:
    """>0 nếu doc_a có thẩm quyền thấp hơn doc_b (dùng cho sorted(): thẩm quyền cao đứng trước)."""
    tier_a, tier_b = precedence_tier(doc_a), precedence_tier(doc_b)
    if tier_a != tier_b:
        return tier_a - tier_b
    return -compare_versions(doc_a.version, doc_b.version)


def sort_by_precedence(documents: list[Document]) -> list[Document]:
    """Sắp xếp theo thẩm quyền: bậc cao hơn trước, cùng bậc thì version mới hơn trước."""
    return sorted(documents, key=cmp_to_key(_compare))
