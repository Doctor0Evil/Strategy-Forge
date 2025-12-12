import json
import os
from typing import Optional

from jose import jwk, jwt
from jose.utils import base64url_decode  # python-jose, not standard lib

BASE_DIR = os.getenv("STRATEGYFORGE_BASE_DIR", os.path.join(os.path.dirname(__file__), ".."))


def load_did_document() -> Optional[dict]:
    path = os.path.join(BASE_DIR, "config", "did.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_did_token(token: str) -> bool:
    doc = load_did_document()
    if not doc:
        return False

    auth = doc.get("authentication", [])
    if not auth:
        return False
    vm_id = auth[0]

    vm = None
    for candidate in doc.get("verificationMethod", []):
        if candidate.get("id") == vm_id:
            vm = candidate
            break
    if not vm:
        return False

    jwk_pub = vm.get("publicKeyJwk")
    if not jwk_pub:
        return False

    headers = jwt.get_unverified_header(token)
    if headers.get("alg") != "ES256":
        return False

    k = jwk.construct(jwk_pub, algorithm="ES256")
    message, encoded_sig = token.rsplit(".", 1)
    decoded_sig = base64url_decode(encoded_sig.encode("utf-8"))
    if not k.verify(message.encode("utf-8"), decoded_sig):
        return False

    claims = jwt.get_unverified_claims(token)
    did_uri = os.getenv("DID_URI", doc.get("id"))
    if did_uri and claims.get("sub") != did_uri:
        return False

    return True
