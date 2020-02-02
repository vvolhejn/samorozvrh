all: build-all

build-all: build-solver build-server build-frontend

build-solver:
	cd solver && sudo make -j

build-server:
	cd backend/server && make -j
	mkdir -p cache/courses
	python3 generate_dummy_subjects.py

build-frontend:
	cd frontend && make -j

clear-cache:
	rm -rf cache/courses/
	mkdir -p cache/courses
	python3 generate_dummy_subjects.py
