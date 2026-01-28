from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class VideoModel:
    id: Any | None = None
    title: str | None = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "_id": self.id,
            "title": self.title,
        }

