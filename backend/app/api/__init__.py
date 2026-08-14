"""API router package — imports every endpoint module so that `main.py`
can simply `from app.api import auth, courses, lessons, newsletter, streak`.
"""

from . import auth, courses, lessons, newsletter  # noqa: F401  (imported for router registration side effect)
from . import streak  # noqa: F401