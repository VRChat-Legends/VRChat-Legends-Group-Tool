"""Encrypted storage for sensitive data (tokens, passwords, API keys)."""
import base64
import hashlib
import os
import secrets as _secrets

from .config import DATA_DIR, INSTALL_DIR


def _get_key_bytes():
    """Derive key bytes from persisted secret."""
    key_file = os.path.join(DATA_DIR, ".secrets_key")
    try:
        if os.path.exists(key_file):
            with open(key_file, "rb") as f:
                return hashlib.sha256(f.read()).digest()
        os.makedirs(DATA_DIR, exist_ok=True)
        raw = _secrets.token_bytes(32)
        with open(key_file, "wb") as f:
            f.write(raw)
        return hashlib.sha256(raw).digest()
    except Exception:
        fallback = os.path.abspath(INSTALL_DIR)
        return hashlib.sha256(fallback.encode()).digest()


def _xor_encrypt(plain: str) -> str:
    """XOR obfuscation with machine-bound key."""
    if not plain:
        return ""
    key = _get_key_bytes()
    key_str = (key.hex() * (len(plain) // 64 + 1))[:len(plain)]
    encoded = base64.b64encode(
        bytes(a ^ ord(b) for a, b in zip(plain.encode("utf-8"), key_str))
    ).decode("ascii")
    return encoded


def _xor_decrypt(cipher: str) -> str:
    """Decrypt XOR-obfuscated string."""
    if not cipher:
        return ""
    try:
        raw = base64.b64decode(cipher.encode("ascii"))
        key = _get_key_bytes()
        key_str = (key.hex() * (len(raw) // 64 + 1))[:len(raw)]
        return bytes(a ^ ord(b) for a, b in zip(raw, key_str)).decode("utf-8")
    except Exception:
        return ""


def encrypt_secret(plain: str) -> str:
    """Encrypt and return base64 string."""
    return _xor_encrypt(plain or "")


def decrypt_secret(cipher: str) -> str:
    """Decrypt and return plaintext."""
    return _xor_decrypt(cipher or "")
