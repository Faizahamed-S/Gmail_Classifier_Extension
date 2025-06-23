
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai, os


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY env-var is missing")

client = openai.OpenAI(api_key=OPENAI_API_KEY)

# ── 1 │ FastAPI app + CORS -----------------------------------------
app = FastAPI(title="Gmail-AI classifier", version="2025-06-22")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                   # later you can restrict this
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── 2 │ Request / response models ----------------------------------
class EmailRequest(BaseModel):
    email: str

SYSTEM_PROMPT = """You're an assistant that helps classify emails for a student
looking for jobs.

Categorize the following email into exactly ONE of these categories:
- Applied
- Next Round
- Interview/Meet
- Job Notification
- Rejection
- Not Important

Only respond with the category name.
""".strip()

# ── 3 │ CORS pre-flight (makes OPTIONS always succeed) -------------
@app.options("/classify")
async def options_classify():
    # FastAPI's CORSMiddleware will inject
    # the Access-Control-Allow-* headers for us.
    return {}                            # 204 No-Content is fine

# ── 4 │ Main endpoint ----------------------------------------------
@app.post("/classify")
async def classify_email(req: EmailRequest):
    """
    Returns: {"category": "<one of the six labels>"}
    """
    try:
        rsp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.2,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": f'Email content:\n"{req.email}"'}
            ],
        )
        content = rsp.choices[0].message.content
        if content is None:
            label = "Not Important"
        else:
            label = content.strip()
        return {"category": label}

    except Exception as exc:
        # Surface the error to the extension for easier debugging
        raise HTTPException(status_code=500, detail=str(exc))