from src.schemas.comparison_contract import (
    ContradictionFlag,
    HallucinationFlag,
    VerificationStatus,
)


def classify_verification_status(
    match_score: float,
    hallucinations: list[HallucinationFlag],
    contradictions: list[ContradictionFlag],
) -> tuple[VerificationStatus, str]:
    """
    Classify the review decision into one of three statuses.

    Rules:
    - MANUAL_REVIEW_REQUIRED: If any hallucination or contradiction is detected,
      or if match_score is below 0.75.
    - VERIFIED_WITH_WARNING: If match_score is between 0.75 and 0.89 with no critical flags.
    - VERIFIED: If match_score >= 0.90 with zero hallucinations and zero contradictions.
    """
    if hallucinations:
        reasons = [h.reason for h in hallucinations[:2]]
        return (
            VerificationStatus.MANUAL_REVIEW_REQUIRED,
            f"Blocked by {len(hallucinations)} hallucination flag(s): {'; '.join(reasons)}",
        )

    if contradictions:
        topics = [c.topic for c in contradictions[:2]]
        return (
            VerificationStatus.MANUAL_REVIEW_REQUIRED,
            f"Blocked by {len(contradictions)} policy contradiction(s): {'; '.join(topics)}",
        )

    if match_score < 0.75:
        return (
            VerificationStatus.MANUAL_REVIEW_REQUIRED,
            f"Match score too low ({match_score:.1%}), below 75% threshold.",
        )

    if match_score < 0.90:
        return (
            VerificationStatus.VERIFIED_WITH_WARNING,
            f"Verified with minor differences. Match score is {match_score:.1%}.",
        )

    return (
        VerificationStatus.VERIFIED,
        f"Fully verified across both pipelines. Match score is {match_score:.1%}.",
    )
