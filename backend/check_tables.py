from app.database.core import engine
from sqlalchemy import text


def check_tables():
    """Check existing tables in database"""
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        )
        tables = [row[0] for row in result]
        print(f"Tables in database: {tables}")
        return tables


if __name__ == "__main__":
    check_tables()
