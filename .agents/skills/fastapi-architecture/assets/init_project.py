#!/usr/bin/env python3
"""
FastAPI Clean Architecture Project Initializer
Creates a new FastAPI project following clean architecture principles.
"""

import argparse
import os
from pathlib import Path


def create_project_structure(project_name: str) -> None:
    """Create directory structure for FastAPI clean architecture."""
    base = Path(project_name)

    # Core structure
    directories = [
        "app/api/v1/routers",
        "app/api/dependencies",
        "app/core",
        "app/services",
        "app/infrastructure/database",
        "app/infrastructure/repositories",
        "app/infrastructure/external_apis",
        "app/config",
        "tests/unit/services",
        "tests/unit/core",
        "tests/integration/api",
        "tests/integration/repositories",
    ]

    for dir_path in directories:
        (base / dir_path).mkdir(parents=True, exist_ok=True)
        (base / dir_path / "__init__.py").touch()

    # Create __init__.py files
    (base / "app" / "__init__.py").touch()
    (base / "tests" / "__init__.py").touch()

    print(f"✅ Project structure created for {project_name}")
    print("\nNext steps:")
    print("1. cd into project directory")
    print(
        "2. Install dependencies: pip install fastapi uvicorn pydantic sqlalchemy pytest httpx"
    )
    print("3. Configure settings in app/config/settings.py")
    print("4. Start building your application!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialize FastAPI Clean Architecture Project"
    )
    parser.add_argument("project_name", help="Name of the project")
    args = parser.parse_args()

    create_project_structure(args.project_name)
