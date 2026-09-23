from typing import Optional
from fastapi import Request

class User:
    def __init__(self, user_id: str, email: str, role: str):
        self.id = user_id
        self.email = email
        self.role = role

async def get_current_user_optional(request: Request) -> Optional[User]:
    """
    Architecture-ready authentication dependency stub.
    Disabled by default for local quant research workflow.
    Can be replaced with JWT validation or OAuth session checks.
    """
    return User(
        user_id="usr_quant_local_01",
        email="analyst@quant-research.local",
        role="ANALYST"
    )
