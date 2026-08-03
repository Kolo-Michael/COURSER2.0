import asyncio
from sqlalchemy import select
from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models import User


async def fix_super_admin():
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.email == "superadmin@smarttutor.com")
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update password with bcrypt hash
            existing.hashed_password = hash_password("SuperAdmin123!")
            await db.commit()
            print("Super admin password updated to bcrypt!")
        else:
            # Create new with bcrypt
            super_admin = User(
                username="superadmin",
                email="superadmin@smarttutor.com",
                hashed_password=hash_password("SuperAdmin123!"),
                full_name="Super Admin",
                role="super_admin",
                is_active=True,
                is_verified=True,
            )
            db.add(super_admin)
            await db.commit()
            print("Super admin created with bcrypt!")

        print("Email: superadmin@smarttutor.com")
        print("Password: SuperAdmin123!")


if __name__ == "__main__":
    asyncio.run(fix_super_admin())