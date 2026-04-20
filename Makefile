.PHONY: install seed dev-api dev-frontend dev docker-up docker-down

install:
	pip install -r requirements.txt && npm install

seed:
	python seed_db.py

dev-api:
	python run.py

dev-frontend:
	npm run dev

dev:
	$(MAKE) -j2 dev-api dev-frontend

docker-up:
	docker compose up --build

docker-down:
	docker compose down
