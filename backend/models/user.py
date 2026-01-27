from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class UserModel:
    id: Any | None = None
    email: str | None = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "_id": self.id,
            "email": self.email,
        }

