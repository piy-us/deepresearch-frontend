"""
GitLab Sales Assistant — FastAPI + LangChain create_agent

Install:
    pip install fastapi uvicorn python-dotenv \
    langchain langchain-google-genai

Run:
    uvicorn main:app --reload --port 8000
"""

import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain.tools import tool
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
)
from langchain_google_genai import ChatGoogleGenerativeAI

# NEW IMPORTS
from langchain.agents import create_agent

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="GitLab Sales Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY HISTORY STORE
# ─────────────────────────────────────────────────────────────────────────────

_history_store: dict[str, List] = {}


def load_history(contact_id: str) -> List:
    return _history_store.get(contact_id, [])


def save_history(contact_id: str, messages: List) -> None:
    _history_store[contact_id] = messages


def clear_history(contact_id: str) -> None:
    _history_store.pop(contact_id, None)


# ─────────────────────────────────────────────────────────────────────────────
# TOOLS
# ─────────────────────────────────────────────────────────────────────────────

@tool
def gitlab_knowledge(query: str) -> str:
    """
    Search GitLab product knowledge: features, tiers, pricing,
    and competitive positioning.
    """

    knowledge_base = """
    ## GitLab overview
    GitLab is a complete DevSecOps platform — one tool that covers the entire
    software delivery lifecycle: plan, code, build, test, secure, deploy, and monitor.

    ## Tiers
    - Free: unlimited repos, basic CI/CD
    - Premium ($29/user/month)
    - Ultimate ($99/user/month)

    ## Competitor positioning
    GitHub:
    GitLab has built-in security scanning and stronger enterprise compliance.

    Jira + Jenkins:
    GitLab unifies planning + CI/CD in one platform.

    Azure DevOps:
    GitLab is stronger on security scanning and multi-cloud support.

    ## Common pain points
    - Too many tools
    - Slow deployments
    - Security found too late
    - Poor visibility

    ## GitLab Duo
    AI-generated summaries, code suggestions,
    vulnerability explanations, and root cause analysis.

    ## Objection handling
    "It's too expensive":
    Compare total cost across Jira + GitHub + Snyk + Jenkins.

    "We're happy with our setup":
    Ask how much time they spend maintaining integrations.

    "We need to evaluate":
    Offer a 30-day Ultimate trial.
    """

    return knowledge_base.strip()


# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are a sales assistant helping a non-technical GitLab sales rep
have better conversations with potential customers.

You are talking to the REP, not the customer.

Your job:
- Help the rep understand client needs
- Suggest smart follow-up questions
- Explain GitLab features simply
- Handle objections confidently
- Keep responses concise and actionable

Always use the gitlab_knowledge tool when you need:
- product details
- pricing
- competitive positioning

Format your response:
1. Brief direct answer
2. Suggested follow-ups (if relevant)
3. One-sentence explanation the rep can reuse

Tone:
Warm, practical, concise.
"""

# ─────────────────────────────────────────────────────────────────────────────
# BUILD AGENT (NEW STYLE)
# ─────────────────────────────────────────────────────────────────────────────

def build_agent():

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite",
        google_api_key=os.getenv("GOOGLE_AI_KEY"),
        temperature=0.3,
    )

    tools = [gitlab_knowledge]

    # NEW MODERN API
    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )

    return agent


_agent = build_agent()

# ─────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    contact_id: str
    contact_name: str
    message: str


class ChatResponse(BaseModel):
    reply: str


class ClearRequest(BaseModel):
    contact_id: str


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):

    if not req.message.strip():
        raise HTTPException(
            status_code=400,
            detail="message cannot be empty"
        )

    # Load existing history
    history = load_history(req.contact_id)

    # Build message list
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        *history,
        HumanMessage(content=req.message),
    ]

    try:
        result = await _agent.ainvoke({
            "messages": messages
        })

        final_message = result["messages"][-1]

        # Handle Gemini structured output
        if isinstance(final_message.content, list):
            reply = "\n".join(
                block["text"]
                for block in final_message.content
                if isinstance(block, dict)
                and block.get("type") == "text"
            )
        else:
            reply = str(final_message.content)

    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Save updated history
    history.append(HumanMessage(content=req.message))
    history.append(AIMessage(content=reply))

    save_history(req.contact_id, history)

    return ChatResponse(reply=reply)


@app.delete("/api/history")
async def clear_history_route(req: ClearRequest):

    clear_history(req.contact_id)

    return {
        "cleared": req.contact_id
    }


@app.get("/api/history/{contact_id}")
async def get_history(contact_id: str):

    msgs = load_history(contact_id)

    return {
        "contact_id": contact_id,
        "message_count": len(msgs),
        "messages": [
            {
                "role": (
                    "user"
                    if isinstance(m, HumanMessage)
                    else "assistant"
                ),
                "content": m.content,
            }
            for m in msgs
        ],
    }
# """
# GitLab Sales Assistant — FastAPI Backend

# Run:
#     pip install fastapi uvicorn python-dotenv httpx
#     uvicorn main:app --reload --port 8000

# Later: add Azure OpenAI + Azure AI Search RAG inside call_llm(),
#        add Azure AD JWT validation as a FastAPI dependency.
# """

# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import httpx
# import os
# from dotenv import load_dotenv

# load_dotenv()

# app = FastAPI(title="GitLab Sales Assistant API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# SYSTEM_PROMPT = """You are a sales assistant helping a non-technical GitLab sales rep have better conversations with potential customers.

# Your job:
# - Help the rep understand what the client needs in plain language
# - Suggest smart follow-up questions to uncover pain points
# - Explain GitLab features simply (no jargon) so the rep can relay them
# - Handle objections with clear, confident rebuttals
# - Keep responses concise and actionable — the rep may be on a live call

# GitLab context you know well:
# - GitLab is a complete DevSecOps platform: source code management, CI/CD pipelines, security scanning, project management, and more — all in one tool
# - Key competitors: GitHub, Jira+Jenkins stacks, Azure DevOps, Bitbucket
# - Common pain points GitLab solves: too many disconnected tools, slow deployments, security vulnerabilities found late, poor visibility across teams
# - GitLab tiers: Free, Premium, Ultimate

# Always format your response with:
# 1. A brief direct answer or action
# 2. (If relevant) 2–3 suggested follow-up questions the rep can ask the client, labeled "Suggested follow-ups:"
# 3. (If relevant) A simple 1-sentence explanation of a GitLab feature the rep can use

# Keep your tone warm, practical, and encouraging. The rep is not technical — avoid acronyms without explanation."""


# # ── Schemas ──────────────────────────────────────────────────────────────────

# class Message(BaseModel):
#     role: str        # "user" | "assistant"
#     content: str


# class ChatRequest(BaseModel):
#     history: list[Message]
#     message: str


# class ChatResponse(BaseModel):
#     reply: str


# # ── LLM call — swap this for Azure OpenAI + RAG later ───────────────────────

# async def call_llm(history: list[Message], user_text: str) -> str:
#     api_key = os.getenv("GOOGLE_AI_KEY")
#     if not api_key:
#         raise HTTPException(status_code=500, detail="GOOGLE_AI_KEY not configured on server")

#     # Build Gemini contents (filter out chip-only / empty messages)
#     contents = [
#         {
#             "role": "model" if m.role == "assistant" else "user",
#             "parts": [{"text": m.content}],
#         }
#         for m in history
#         if m.content.strip()
#     ]
#     contents.append({"role": "user", "parts": [{"text": user_text}]})

#     url = (
#         "https://generativelanguage.googleapis.com/v1beta/models/"
#         f"gemini-3.1-flash-lite:generateContent?key={api_key}"
#     )
#     payload = {
#         "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
#         "contents": contents,
#     }

#     async with httpx.AsyncClient(timeout=30) as client:
#         resp = await client.post(url, json=payload)

#     if resp.status_code != 200:
#         detail = resp.json().get("error", {}).get("message", f"LLM error {resp.status_code}")
#         raise HTTPException(status_code=502, detail=detail)

#     data = resp.json()
#     text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
#     if not text:
#         raise HTTPException(status_code=502, detail="Empty response from LLM")
#     return text


# # ── Routes ───────────────────────────────────────────────────────────────────

# @app.get("/health")
# async def health():
#     return {"status": "ok"}


# @app.post("/api/chat", response_model=ChatResponse)
# async def chat(req: ChatRequest):
#     """
#     Main chat endpoint.

#     TODO (Azure):
#     - Add `token: str = Depends(verify_azure_ad_token)` for auth
#     - Fetch RAG context from Azure AI Search before call_llm()
#     - Inject context into system prompt or as a system message
#     """
#     reply = await call_llm(req.history, req.message)
#     return ChatResponse(reply=reply)