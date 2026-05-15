"""Manual assessment scoring."""
from __future__ import annotations
from collections import defaultdict
from typing import Any

from ..schemas import (
    AssessmentEvaluateIn, AssessmentResult, DomainScore, RiskLevel,
)
from .questions_loader import find_question, questions_for_sector

ALLOWED_MATURITY = {0, 1, 2, 3}
ALLOWED_CONFIDENCE = {0.0, 0.3, 0.6, 1.0}
MAX_NOTE_LENGTH = 1000


class AssessmentValidationError(ValueError):
    def __init__(self, code: str, message: str, **extra: Any):
        super().__init__(message)
        self.code = code
        self.message = message
        self.extra = extra

    def to_error(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, **self.extra}


def _risk(score: int) -> RiskLevel:
    if score < 40: return "critical"
    if score < 60: return "high"
    if score < 75: return "medium"
    if score < 90: return "low"
    return "minimal"


def _dedupe_latest(payload: AssessmentEvaluateIn):
    by_id = {}
    for response in payload.responses:
        by_id[response.questionId] = response
    return list(by_id.values())


def _is_allowed_confidence(value: float) -> bool:
    return any(abs(float(value) - allowed) < 0.000001 for allowed in ALLOWED_CONFIDENCE)


def _expected_questions(payload: AssessmentEvaluateIn) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    expected = questions_for_sector(payload.sector)
    questions: dict[str, dict[str, Any]] = {}
    for bundle in expected.values():
        for question in bundle["questions"]:
            questions[question["id"]] = question
    return expected, questions


def _validate(payload: AssessmentEvaluateIn):
    expected, questions_by_id = _expected_questions(payload)
    responses = _dedupe_latest(payload)

    for response in responses:
        question = questions_by_id.get(response.questionId)
        if not question:
            raise AssessmentValidationError(
                "ASSESSMENT_INVALID_RESPONSE",
                "Submitted questionId is not part of the selected sector assessment.",
                questionId=response.questionId,
            )
        if response.domainId != question.get("domainId"):
            raise AssessmentValidationError(
                "ASSESSMENT_INVALID_RESPONSE",
                "Submitted domainId does not match the question.",
                questionId=response.questionId,
                domainId=response.domainId,
                expectedDomainId=question.get("domainId"),
            )
        if response.maturityLevel not in ALLOWED_MATURITY:
            raise AssessmentValidationError(
                "ASSESSMENT_INVALID_RESPONSE",
                "maturityLevel must be one of 0, 1, 2, or 3.",
                questionId=response.questionId,
                field="maturityLevel",
            )
        if not _is_allowed_confidence(response.evidenceConfidence):
            raise AssessmentValidationError(
                "ASSESSMENT_INVALID_RESPONSE",
                "evidenceConfidence must be one of 0, 0.3, 0.6, or 1.",
                questionId=response.questionId,
                field="evidenceConfidence",
            )
        if response.evidenceNote and len(response.evidenceNote) > MAX_NOTE_LENGTH:
            raise AssessmentValidationError(
                "ASSESSMENT_INVALID_RESPONSE",
                "evidenceNote must be 1000 characters or fewer.",
                questionId=response.questionId,
                field="evidenceNote",
            )

    if payload.final and len(responses) != len(questions_by_id):
        raise AssessmentValidationError(
            "ASSESSMENT_INCOMPLETE",
            f"Final evaluation requires {len(questions_by_id)} answered questions.",
            answered=len(responses),
            expected=len(questions_by_id),
        )

    return expected, questions_by_id, responses


def evaluate(payload: AssessmentEvaluateIn) -> AssessmentResult:
    by_domain: dict[str, list[dict[str, Any]]] = defaultdict(list)
    expected, questions_by_id, responses = _validate(payload)
    expected_totals = {d: len(v["questions"]) for d, v in expected.items()}

    critical_gaps: list[dict[str, Any]] = []
    weak_evidence: list[dict[str, Any]] = []

    for r in responses:
        q = questions_by_id.get(r.questionId) or find_question(r.questionId) or {}
        severity = (q.get("severity") or "medium").lower()
        weight = float(q.get("weight") or 1.0)
        control_score = (r.maturityLevel / 3) * 100 * r.evidenceConfidence
        by_domain[r.domainId].append({
            "score": control_score, "weight": weight,
            "confidence": r.evidenceConfidence * 100,
        })
        if severity in ("critical", "high") and (r.maturityLevel == 0 or r.evidenceConfidence <= 0.3):
            critical_gaps.append({
                "questionId": r.questionId, "domainId": r.domainId,
                "severity": severity, "controlCode": q.get("controlCode"),
                "question": q.get("question"),
            })
        if r.evidenceConfidence <= 0.3:
            weak_evidence.append({
                "questionId": r.questionId, "evidenceConfidence": r.evidenceConfidence,
            })

    domain_scores: dict[str, DomainScore] = {}
    overall_acc = 0.0
    overall_w = 0.0
    conf_acc = 0.0
    conf_n = 0
    for did, items in by_domain.items():
        w_sum = sum(i["weight"] for i in items) or 1.0
        s = sum(i["score"] * i["weight"] for i in items) / w_sum
        c = sum(i["confidence"] for i in items) / len(items)
        domain_scores[did] = DomainScore(
            score=round(s), answered=len(items),
            total=expected_totals.get(did, len(items)),
            evidenceConfidence=round(c),
        )
        # Domain weight = aggregate of question weights
        overall_acc += s * w_sum
        overall_w += w_sum
        conf_acc += c * len(items)
        conf_n += len(items)

    overall = round(overall_acc / overall_w) if overall_w else 0
    avg_conf = round(conf_acc / conf_n) if conf_n else 0

    recs: list[str] = []
    if critical_gaps:
        recs.append(f"Address {len(critical_gaps)} critical/high gap(s) first.")
    if avg_conf < 60:
        recs.append("Track stronger evidence references to raise confidence above 60%.")
    if overall < 60:
        recs.append("Focus on ISMS scope, risk treatment, and documentation maturity.")

    return AssessmentResult(
        overallScore=overall,
        riskLevel=_risk(overall),
        evidenceConfidence=avg_conf,
        domainScores=domain_scores,
        criticalGaps=critical_gaps,
        weakEvidence=weak_evidence,
        recommendations=recs,
    )
