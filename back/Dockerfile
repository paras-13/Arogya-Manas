# Use the official Python slim image
FROM python:3.13-slim

# Set environment variables
# PIP_DISABLE_PIP_VERSION_CHECK=1 disables the pip version check
# PYTHONDONTWRITEBYTECODE=1 prevents Python from writing .pyc files (saves space/time)
# PYTHONUNBUFFERED=1 ensures our console output is not buffered by Docker
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencies required for mysqlclient
RUN apt-get update \
    && apt-get install -y default-libmysqlclient-dev pkg-config gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
