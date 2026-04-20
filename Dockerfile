FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY db.py run.py seed_db.py ./

EXPOSE 5000

CMD ["python", "run.py"]
