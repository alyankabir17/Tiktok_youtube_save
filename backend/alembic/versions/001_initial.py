"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-04-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("provider", sa.String(length=50), nullable=False, server_default="credentials"),
        sa.Column("provider_id", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "download_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.String(length=20), nullable=False),
        sa.Column("original_url", sa.String(length=2000), nullable=False),
        sa.Column("video_title", sa.String(length=500), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=2000), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("format", sa.String(length=10), nullable=False),
        sa.Column("quality", sa.String(length=20), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("downloaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="completed"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_download_history_user_id", "download_history", ["user_id"], unique=False)
    op.create_index("ix_download_history_downloaded_at", "download_history", ["downloaded_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_download_history_downloaded_at", table_name="download_history")
    op.drop_index("ix_download_history_user_id", table_name="download_history")
    op.drop_table("download_history")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
