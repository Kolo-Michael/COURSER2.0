import asyncio
import hashlib
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models import User


async def create_super_admin():
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.email == "superadmin@smarttutor.com")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("Super admin already exists!")
            return

        hashed_password = hashlib.sha256("SuperAdmin123!".encode()).hexdigest()
        super_admin = User(
            username="superadmin",
            email="superadmin@smarttutor.com",
            hashed_password=hashed_password,
            full_name="Super Admin",
            role="super_admin",
            is_active=True,
            is_verified=True,
        )
        db.add(super_admin)
        await db.commit()
        print("Super admin created successfully!")
        print("Email: superadmin@smarttutor.com")
        print("Password: SuperAdmin123!")


if __name__ == "__main__":
    asyncio.run(create_super_admin())
