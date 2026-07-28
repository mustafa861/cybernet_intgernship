import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Enum, ForeignKey, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(Text, unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    business_name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    categories: Mapped[list["Category"]] = relationship(
        "Category", back_populates="user"
    )
    entries: Mapped[list["Entry"]] = relationship("Entry", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id")
    )
    name: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(
        Enum("expense", "income", "asset", "liability", "equity", name="category_type"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="categories")
    entries: Mapped[list["Entry"]] = relationship("Entry", back_populates="category")


class Entry(Base):
    __tablename__ = "entries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id")
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("categories.id")
    )
    entry_type: Mapped[str] = mapped_column(
        Enum("expense", "income", name="entry_type"),
    )
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(Text, default="PKR")
    entry_date: Mapped[date] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(
        Enum("manual", "ai_agent", name="entry_source"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="entries")
    category: Mapped["Category"] = relationship("Category", back_populates="entries")
    audit_flags: Mapped[list["AuditFlag"]] = relationship(
        "AuditFlag", back_populates="entry"
    )


class AuditFlag(Base):
    __tablename__ = "audit_flags"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    entry_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("entries.id")
    )
    month: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", name="audit_severity"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    entry: Mapped["Entry"] = relationship("Entry", back_populates="audit_flags")
