import pytest

from app.assessment.questions_loader import questions_for_sector
from app.assessment.scoring import AssessmentValidationError, evaluate
from app.schemas import AssessmentEvaluateIn, AssessmentResponseIn


def _all_responses(sector: str = "saas", maturity: int = 3, confidence: float = 1.0):
    out = []
    for bundle in questions_for_sector(sector).values():
        for question in bundle["questions"]:
            out.append(
                AssessmentResponseIn(
                    questionId=question["id"],
                    domainId=question["domainId"],
                    maturityLevel=maturity,
                    evidenceConfidence=confidence,
                )
            )
    return out


def test_perfect_responses():
    res = evaluate(
        AssessmentEvaluateIn(
            sector="saas",
            responses=_all_responses("saas"),
        )
    )
    assert res.overallScore == 100
    assert res.riskLevel == "minimal"
    assert res.evidenceConfidence == 100


def test_incomplete_final_response_rejected():
    with pytest.raises(AssessmentValidationError) as exc:
        evaluate(
            AssessmentEvaluateIn(
                sector="saas",
                responses=[
                    AssessmentResponseIn(
                        questionId="D1-C01",
                        domainId="D1",
                        maturityLevel=3,
                        evidenceConfidence=1.0,
                    )
                ],
            )
        )
    assert exc.value.code == "ASSESSMENT_INCOMPLETE"
    assert exc.value.extra["answered"] == 1
    assert exc.value.extra["expected"] == 81


def test_zero_maturity_flags_critical_gap_in_draft():
    res = evaluate(
        AssessmentEvaluateIn(
            sector="saas",
            final=False,
            responses=[
                AssessmentResponseIn(
                    questionId="D1-SAAS-01",
                    domainId="D1",
                    maturityLevel=0,
                    evidenceConfidence=0.0,
                )
            ],
        )
    )
    assert res.overallScore == 0
    assert res.riskLevel == "critical"
    assert len(res.criticalGaps) == 1


def test_questions_loader_saas_sector():
    out = questions_for_sector("saas")
    assert set(out.keys()) == {f"D{i}" for i in range(1, 10)}
    for _, v in out.items():
        assert len(v["questions"]) == 9  # 6 core + 3 saas


def test_questions_loader_display_sector_labels():
    for sector in ("SaaS / Software", "E-commerce", "Healthtech"):
        out = questions_for_sector(sector)
        assert sum(len(v["questions"]) for v in out.values()) == 81


def test_duplicate_responses_latest_wins():
    responses = _all_responses("saas")
    first = responses[0]
    responses = [
        AssessmentResponseIn(
            questionId=first.questionId,
            domainId=first.domainId,
            maturityLevel=0,
            evidenceConfidence=0.0,
        ),
        *responses,
    ]
    res = evaluate(AssessmentEvaluateIn(sector="saas", responses=responses))
    assert res.overallScore == 100


@pytest.mark.parametrize(
    "response",
    [
        AssessmentResponseIn(
            questionId="missing",
            domainId="D1",
            maturityLevel=3,
            evidenceConfidence=1.0,
        ),
        AssessmentResponseIn(
            questionId="D1-C01",
            domainId="D2",
            maturityLevel=3,
            evidenceConfidence=1.0,
        ),
        AssessmentResponseIn(
            questionId="D1-C01",
            domainId="D1",
            maturityLevel=4,
            evidenceConfidence=1.0,
        ),
        AssessmentResponseIn(
            questionId="D1-C01",
            domainId="D1",
            maturityLevel=3,
            evidenceConfidence=0.5,
        ),
        AssessmentResponseIn(
            questionId="D1-C01",
            domainId="D1",
            maturityLevel=3,
            evidenceConfidence=1.0,
            evidenceNote="x" * 1001,
        ),
    ],
)
def test_invalid_responses_rejected(response):
    with pytest.raises(AssessmentValidationError) as exc:
        evaluate(
            AssessmentEvaluateIn(
                sector="saas",
                final=False,
                responses=[response],
            )
        )
    assert exc.value.code == "ASSESSMENT_INVALID_RESPONSE"
