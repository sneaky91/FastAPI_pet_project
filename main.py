from contextlib import asynccontextmanager

from fastapi import FastAPI, Body, Request
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine, get_user_requests, add_request_data, ensure_conversation_column, delete_conversation
from gemini_client import get_answer_from_gemini


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    ensure_conversation_column()
    print("all tables created")
    yield


app = FastAPI(
    title="Gemini API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:60831"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/requests")
def got_my_requests(request: Request):
    user_ip_address = request.client.host
    print(user_ip_address)
    user_requests = get_user_requests(
        ip_address=user_ip_address
    )
    return user_requests


@app.post("/requests")
def send_my_prompt(
    request: Request,
    prompt: str = Body(embed=True),
    conversation_id: str = Body(default="default", embed=True),
):
    user_ip_address = request.client.host
    answer = get_answer_from_gemini(prompt)
    add_request_data(
        ip_address=user_ip_address,
        prompt=prompt,
        response=answer,
        conversation_id=conversation_id,
    )
    return {"answer": answer}


@app.delete("/requests/{conversation_id}")
def remove_conversation(conversation_id: str, request: Request):
    deleted = delete_conversation(
        ip_address=request.client.host,
        conversation_id=conversation_id,
    )
    return {"deleted": deleted, "conversation_id": conversation_id}
