all: build-all

build-all: build-solver build-server build-frontend

build-solver:
	cd solver && sudo make -j

build-server:
	cd server && make -j
	mkdir -p cache
	python3 generate_dummy_subjects.py

build-frontend:
	cd frontend && make -j

clear-cache:
	rm -rf cache/*
	python3 generate_dummy_subjects.py
