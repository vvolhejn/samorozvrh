all: build-all

build-all: build-solver build-server

build-solver:
	cd solver && make -j

build-server:
	cd server && make -j
