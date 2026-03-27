from django.db import models
from apps.accounts.models import User

class ChatMessage(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ai_chat_messages"
    )
    content = models.TextField()
    is_from_user = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        who = "User" if self.is_from_user else "AI"
        return f"{who}: {self.content[:20]}"


class SessionReport(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ai_session_reports"
    )
    session_name = models.CharField(max_length=255, default="Untitled Session")
    summary_json = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.session_name} | {self.created_at}"
