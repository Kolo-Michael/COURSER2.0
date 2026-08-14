"""Services package — business logic above the models.

`auth_service` orchestrates hashing + token issuance against the database,
`email_service` generates reset codes and sends mail (or prints in dev),
and `streak_service` keeps track of learning streaks and restores.
"""

# Imported so `from app.services import auth_service` works everywhere;
# other services are imported lazily where needed to avoid circular deps.
from . import auth_service