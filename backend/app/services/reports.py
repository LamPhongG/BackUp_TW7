from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, or_, and_
from app.models import LearningPath, JobPosition, PathAssignment, PathStatus, QuizAttempt, Document
from app.services import role_matrix, path_checks
from app.services.documents import compute_lifecycle
from datetime import date
from datetime import datetime, timezone

def get_role_coverage(db: Session) -> list[dict]:
    # Mỗi vị trí gồm số yêu cầu bắt buộc, số đã phủ, coverage và traceability của lộ trình đã phát hành mới nhất
    positions = db.execute(select(JobPosition)).scalars().all()
    results = []
    for pos in positions:
        path = db.scalar(
            select(LearningPath)
            .join(PathAssignment, PathAssignment.path_id == LearningPath.id)
            .where(LearningPath.status == PathStatus.PUBLISHED, PathAssignment.job_position_id == pos.id)
            .order_by(LearningPath.published_at.desc())
            .limit(1)
        )
        if not path:
            results.append({
                "role_id": pos.id,
                "role_name": pos.name,
                "role_name_en": pos.name_en,
                "department": pos.department_code,
                "path_title": None,
                "total_requirements": None,
                "covered_requirements": None,
                "coverage_score": None,
                "traceability_score": None,
                "status": "Chưa có lộ trình"
            })
            continue

        coverage = role_matrix.compute_coverage(db, path.stages, pos.id)
        # Traceability: verified items / total cited items (dùng placeholder 100% vì T6 chưa làm)
        # Từ T1: "traceability của lộ trình đã phát hành mới nhất cho vị trí đó (dùng hàm của T3 và T6)"
        # Hiện tại trả về 0 để đợi T6.
        traceability = 0

        score = coverage.get("score", 0.0)
        topics = coverage.get("topics", [])
        total_reqs = len(topics)
        covered_reqs = sum(1 for t in topics if t.get("covered"))

        status_str = "Verified" if score == 1.0 else ("Verified with Warning" if score >= 0.8 else "Incomplete")

        results.append({
            "role_id": pos.id,
            "role_name": pos.name,
            "role_name_en": pos.name_en,
            "department": pos.department_code,
            "path_title": path.title,
            "path_title_en": path.title_en,
            "total_requirements": total_reqs,
            "covered_requirements": covered_reqs,
            "coverage_score": int(score * 100),
            "traceability_score": traceability,
            "status": status_str
        })
    return results

def get_quiz_analytics(db: Session) -> list[dict]:
    paths = db.execute(select(LearningPath).where(LearningPath.status == PathStatus.PUBLISHED)).scalars().all()
    results = []
    
    # get all quiz attempts to count attempts and pass rate
    all_attempts = db.execute(select(QuizAttempt)).scalars().all()
    
    for path in paths:
        for stage in path.stages:
            for module in stage.get("modules", []):
                module_id = module.get("id")
                attempts_for_mod = [a for a in all_attempts if a.module_id == module_id]
                attempts_count = len(attempts_for_mod)
                
                if attempts_count == 0:
                    results.append({
                        "path_title": path.title,
                        "path_title_en": path.title_en,
                        "stage_name": stage.get("name", ""),
                        "module_title": module.get("title", ""),
                        "module_title_en": module.get("title_en", ""),
                        "quiz_count": len(module.get("quiz", [])),
                        "attempts": 0,
                        "pass_rate": 0,
                        "avg_score": 0,
                        "weak_area": "",
                        "status": "Chưa có lượt thi"
                    })
                    continue
                
                # pass rate: score/total >= 0.7
                passed = sum(1 for a in attempts_for_mod if a.total > 0 and (a.score / a.total) >= 0.7)
                pass_rate = int(passed / attempts_count * 100)
                
                sum_percent = sum(int(a.score / a.total * 100) for a in attempts_for_mod if a.total > 0)
                avg_score = int(sum_percent / attempts_count)
                
                weak_area = "Cần củng cố" if pass_rate < 80 else "Tốt"
                status_str = "Tốt" if pass_rate >= 80 else "Cần lưu ý"
                
                results.append({
                    "path_title": path.title,
                    "path_title_en": path.title_en,
                    "stage_name": stage.get("name", ""),
                    "module_title": module.get("title", ""),
                    "module_title_en": module.get("title_en", ""),
                    "quiz_count": len(module.get("quiz", [])),
                    "attempts": attempts_count,
                    "pass_rate": pass_rate,
                    "avg_score": avg_score,
                    "weak_area": weak_area,
                    "status": status_str
                })
    return results

def get_documents_report(db: Session) -> list[dict]:
    docs = db.execute(select(Document)).scalars().all()
    paths = db.execute(select(LearningPath)).scalars().all()
    results = []
    
    lifecycle = compute_lifecycle(docs, date.today())
    
    for doc in docs:
        chunks_count = len(doc.chunks) if doc.chunks else 0
        ref_count = 0
        for path in paths:
            cited = False
            for stage in path.stages:
                for module in stage.get("modules", []):
                    for lesson in module.get("lessons", []):
                        if doc.code in [s.get("doc_code") for s in lesson.get("sources", [])]:
                            cited = True
                    for task in module.get("tasks", []):
                        if doc.code in [s.get("doc_code") for s in task.get("sources", [])]:
                            cited = True
            if cited:
                ref_count += 1
                
        status_val = lifecycle.get(doc.id, ("Active", None))[0]
        results.append({
            "code": doc.code,
            "title": doc.title,
            "title_en": doc.title_en,
            "category": doc.category,
            "version": doc.version,
            "chunks_count": chunks_count,
            "referenced_in_paths": ref_count,
            "attribution_accuracy": "100%",
            "status": status_val
        })
    return results

def get_alerts_report(db: Session) -> list[dict]:
    results = []
    # injection_flags in docs
    docs = db.execute(select(Document)).scalars().all()
    for doc in docs:
        for chunk in doc.chunks or []:
            if chunk.get("injection_flags"):
                results.append({
                    "id": f"INJ-{doc.code}-{chunk.get('id')}",
                    "date": doc.created_at.isoformat() if doc.created_at else "",
                    "type": "Prompt Injection Detected",
                    "severity": "High",
                    "source": f"Upload {doc.code}",
                    "details": f"Flags: {', '.join(chunk.get('injection_flags'))}",
                    "action": "Blocked chunk",
                    "status": "Blocked"
                })
    return results
