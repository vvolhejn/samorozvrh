all: build-all

build-all: build-solver

build-solver:
	cd solver && make -j
