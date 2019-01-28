all: install-solver

python = python3

install-solver: ../env/
	../env/bin/python -m pip install -e .

../env/:
	$(python) -m pip install --user virtualenv
	cd .. && $(python) -m virtualenv env --python=$(python)