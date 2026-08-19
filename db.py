from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import (
    sessionmaker,
    DeclarativeBase,
    Mapped,
    mapped_column,
)


engine = create_engine("sqlite:///requests.db")

session = sessionmaker(engine)


class Base(DeclarativeBase):
    pass


class ChatRequests(Base):
    __tablename__ = "chat_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    ip_address: Mapped[str] = mapped_column(index=True)
    prompt: Mapped[str]
    response: Mapped[str]
    conversation_id: Mapped[str | None] = mapped_column(index=True, nullable=True)


def ensure_conversation_column() -> None:
    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(chat_requests)")).fetchall()
        if not any(column[1] == "conversation_id" for column in columns):
            connection.execute(text("ALTER TABLE chat_requests ADD COLUMN conversation_id VARCHAR"))


def get_user_requests(ip_address: str) -> list[ChatRequests]:
    with session() as new_session:
        query = select(ChatRequests).filter_by(ip_address=ip_address)
        query = query.order_by(ChatRequests.id)

        result = new_session.execute(query)

        return result.scalars().all()


def add_request_data(ip_address: str, prompt, response: str, conversation_id: str) -> None:
    with session() as new_session:
        new_request = ChatRequests(
            ip_address=ip_address,
            prompt=prompt,
            response=response,
            conversation_id=conversation_id,
        )
        new_session.add(new_request)
        new_session.commit()


def delete_conversation(ip_address: str, conversation_id: str) -> int:
    with session() as new_session:
        query = new_session.query(ChatRequests).filter(ChatRequests.ip_address == ip_address)
        if conversation_id == "legacy":
            query = query.filter(ChatRequests.conversation_id.is_(None))
        else:
            query = query.filter(ChatRequests.conversation_id == conversation_id)
        deleted = query.delete(synchronize_session=False)
        new_session.commit()
        return deleted



