import random


class BureauMock:
    """Deterministic fake CIBIL generator. Same name → same score."""

    def get(self, name: str) -> dict:
        seed = hash(name) % 1000
        rng = random.Random(seed)
        return {
            "cibil_score_proxy": rng.randint(650, 850),
            "existing_loans": rng.randint(0, 3),
            "default_history": rng.random() < 0.05,
        }
