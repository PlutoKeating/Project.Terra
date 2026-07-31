import os

import httpx


async def verify_bearer_token(authorization: str | None) -> bool:
    if not authorization or not authorization.lower().startswith("bearer "):
        return False
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not url or not anon_key:
        return False
    token = authorization.split(" ", 1)[1]
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(
            url.rstrip("/") + "/auth/v1/user",
            headers={"apikey": anon_key, "Authorization": "Bearer " + token},
        )
    return response.is_success
