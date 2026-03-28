# Usamos una imagen oficial ligera de Python
FROM python:3.11-slim

# Desactivar la generación de .pyc y forzar logs inmediatos
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instalar dependencias del sistema necesarias para Chrome
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Descargar e instalar Google Chrome directamente (versión estable)
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt-get update && \
    apt-get install -y ./google-chrome-stable_current_amd64.deb && \
    rm ./google-chrome-stable_current_amd64.deb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código de la API
COPY . .

# Comando de inicio usando uvicorn. 
# Render inyecta la variable $PORT automáticamente en el entorno.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
