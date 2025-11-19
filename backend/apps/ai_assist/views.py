import json
import google.generativeai as genai

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from core.jwt_utils import jwt_auth
from .models import ChatMessage, SessionReport

# ---------------------------
# INIT GEMINI
# ---------------------------
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    gemini = genai.GenerativeModel("models/gemini-2.5-flash")
except Exception as e:
    print("Gemini Init Error:", e)
    gemini = None


# ---------------------------
# SYSTEM PROMPT
# ---------------------------
SYSTEM_PROMPT = """
You are ArogyaMitra, an empathetic wellness companion for students.

Your role:
- Be warm, validating, and non-judgmental.
- Never diagnose or name mental disorders (no terms like depression, anxiety disorder, PTSD, etc.).
- Give only safe suggestions like deep breathing, journaling, short walks, hydration, gentle stretches,
  taking a short break, talking to a trusted person, or practicing gratitude.
- If user shares difficult emotions, always validate first before giving suggestions.
- Encourage healthy routines (sleep, food, water, movement, breaks from screens).
- No long essays; keep responses short, conversational, and supportive.
- Do NOT sound like a doctor or therapist. You are a gentle companion.

CRISIS RULE:
If the user talks about suicide or self-harm, your response must be:

"I hear you're in a lot of pain. Because I am an AI, I can't give you the help you need. 
Please book an appointment with a counselor on our ArogyaMans platform."

Do NOT add anything else to this crisis message.

Tone:
- Calm, kind, and simple language.
- No emojis unless the user uses them first.
"""


# ---------------------------
# CHAT HISTORY
# ---------------------------
@csrf_exempt
@jwt_auth
def chat_history(request):
    """
    Return all current (ongoing session) chat messages for the user.
    If there are no ChatMessage rows, treat it as "no active session".
    """
    msgs = ChatMessage.objects.filter(user=request.user).order_by("timestamp")

    history = [
        {
            "id": m.id,
            "sender": "user" if m.is_from_user else "ai",
            "content": m.content,
            "timestamp": m.timestamp,
        }
        for m in msgs
    ]

    return JsonResponse({"history": history})


# ---------------------------
# CHAT API
# ---------------------------
@csrf_exempt
@jwt_auth
def chat_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    if gemini is None:
        return JsonResponse({"reply": "AI not configured"}, status=500)

    # parse body
    try:
        data = json.loads(request.body)
        user_message = data.get("message")
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not user_message:
        return JsonResponse({"error": "Missing message"}, status=400)

    user = request.user

    # Save user message
    ChatMessage.objects.create(
        user=user,
        content=user_message,
        is_from_user=True
    )

    # Crisis check (BEFORE sending to model)
    CRISIS_RESPONSE = (
        "I hear you're in a lot of pain. Because I am an AI, I can't give you the help you need. "
        "Please book an appointment with a counselor on our ArogyaMans platform."
    )

    crisis_keywords = [
        "suicide",
        "kill myself",
        "end my life",
        "want to die",
        "self-harm",
        "hurt myself",
    ]
    lowered = user_message.lower()
    if any(k in lowered for k in crisis_keywords):
        ChatMessage.objects.create(
            user=user,
            content=CRISIS_RESPONSE,
            is_from_user=False
        )
        return JsonResponse({"reply": CRISIS_RESPONSE})

    # build full conversation from DB
    history = ChatMessage.objects.filter(user=user).order_by("timestamp")

    messages = [
        {
            "role": "user",
            "parts": [{"text": SYSTEM_PROMPT}]
        }
    ]

    for msg in history:
        messages.append({
            "role": "user" if msg.is_from_user else "model",
            "parts": [{"text": msg.content}],
        })

    # call gemini
    try:
        response = gemini.generate_content(messages)
        ai_reply = response.text if hasattr(response, "text") else "I'm here with you."
    except Exception as e:
        return JsonResponse(
            {"reply": f"AI service error: {str(e)}"},
            status=500
        )

    # save AI reply
    ChatMessage.objects.create(
        user=user,
        content=ai_reply,
        is_from_user=False
    )

    return JsonResponse({"reply": ai_reply})


# ---------------------------
# END CHAT (SUMMARY)
# ---------------------------
@csrf_exempt
@jwt_auth
def end_chat(request):
    """
    End the current chat "session":
      - take all ChatMessages for this user
      - summarize them into a JSON structure using Gemini
      - store JSON in SessionReport
      - delete ChatMessages (so new session starts fresh)
      - return JSON summary to frontend
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    user = request.user
    history = ChatMessage.objects.filter(user=user).order_by("timestamp")

    if not history.exists():
        return JsonResponse({"error": "No chat found"}, status=400)

    # Build transcript as a simple list of dicts (sender + message)
    transcript = [
        {
            "sender": "user" if m.is_from_user else "ai",
            "message": m.content,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in history
    ]

    # ---- Summary Prompt (ask for JSON only) ----
    prompt = f"""
You are ArogyaMitra, a warm and supportive wellness AI assistant.

Your task is to create a structured JSON summary of this full conversation.
RETURN ONLY VALID JSON. No backticks, no explanation.

JSON structure:
{{
  "user_discussion": "Short description of what the user mainly talked about.",
  "emotions_expressed": "Describe the emotions the user seemed to express (no diagnoses).",
  "assistant_support": "Summarize the key supportive responses/suggestions you (the AI) provided.",
  "conversation_tone": "Describe the overall tone of the conversation in a few words.",
  "closing_note": "A kind, gentle closing note that could be shown to the user later."
}}

Conversation transcript:
{json.dumps(transcript, indent=2)}
"""

    if gemini is None:
        return JsonResponse({"error": "AI not configured"}, status=500)

    try:
        resp = gemini.generate_content(
            [{"role": "user", "parts": [{"text": prompt}]}]
        )
        raw = (resp.text or "").strip()

        # Handle possible ```json ... ``` wrapping
        if raw.startswith("```"):
            raw = raw.strip("`")
            # remove first line if it's "json"
            lines = raw.splitlines()
            if lines and lines[0].strip().lower() == "json":
                raw = "\n".join(lines[1:]).strip()

        summary_json = json.loads(raw)

    except Exception as e:
        return JsonResponse({"error": f"Summary failed: {str(e)}"}, status=500)

    # Save summary
    SessionReport.objects.create(
        user=user,
        summary_json=summary_json
    )

    # Delete chat history (end session)
    history.delete()

    return JsonResponse({"summary": summary_json})


# ---------------------------
# SESSION REPORTS LIST
# ---------------------------
@csrf_exempt
@jwt_auth
def session_reports(request):
    """
    Returns all past session summaries for this user.
    Used by frontend to show "existing chats" summaries.
    """
    user = request.user
    reports = SessionReport.objects.filter(user=user).order_by("-created_at")

    data = []
    for r in reports:
        data.append({
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "summary": r.summary_json,
        })

    return JsonResponse({"reports": data})

@csrf_exempt
@jwt_auth
def rename_session(request, report_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
        new_name = data.get("name")
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not new_name:
        return JsonResponse({"error": "Missing name"}, status=400)

    try:
        report = SessionReport.objects.get(id=report_id, user=request.user)
    except SessionReport.DoesNotExist:
        return JsonResponse({"error": "Session not found"}, status=404)

    report.session_name = new_name
    report.save()

    return JsonResponse({"success": True, "new_name": new_name})

# =====================================================
# LIST ALL SUMMARIES
# =====================================================
@csrf_exempt
@jwt_auth
def session_reports(request):
    user = request.user
    reports = SessionReport.objects.filter(user=user)

    return JsonResponse({
        "reports": [
            {
                "id": r.id,
                "session_name": r.session_name,
                "created_at": r.created_at.isoformat(),
                "summary": r.summary_json
            }
            for r in reports
        ]
    })