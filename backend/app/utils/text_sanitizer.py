import re
from typing import Any, List, Dict, Optional, Union


def strip_asterisks(val: Any) -> Any:
    """
    Recursively removes all asterisks (*) from strings, lists, or dictionary values.
    Converts markdown asterisk bullets (* item or * **item**) to clean hyphen bullets (- item)
    and removes all other asterisks (e.g. **bold**, *italic*, stray *).
    """
    if val is None:
        return None
    if isinstance(val, str):
        # Convert bullet asterisks at the start of any line into clean hyphen bullets
        cleaned = re.sub(r'(?m)^(\s*)\*+(\s+)', r'\1- ', val)
        # Strip all remaining asterisks from everywhere in the text
        cleaned = cleaned.replace('*', '')
        return cleaned
    elif isinstance(val, list):
        return [strip_asterisks(item) for item in val]
    elif isinstance(val, dict):
        return {k: strip_asterisks(v) for k, v in val.items()}
    return val


def clean_skill_tag(skill: str) -> str:
    """Cleans a single skill tag or keyword by removing asterisks and leading bullet markers."""
    if not skill:
        return ""
    cleaned = strip_asterisks(skill).strip()
    cleaned = re.sub(r'^[-•–—\s]+', '', cleaned).strip()
    return cleaned
