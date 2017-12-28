// An interface to the Python solver.
package main

import (
	"fmt"
	// "io"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"strings"
)

const SOLVER_COMMAND = "python3 -m pipenv run python solver/main.py"

func Solve(query []byte) ([]byte, error) {
	tempfile, err := createQueryFile(query)
	if err != nil {
		return nil, err
	}
	defer os.Remove(tempfile.Name()) // clean up

	commandParts := strings.Split(SOLVER_COMMAND+" "+tempfile.Name(), " ")
	subProcess := exec.Command(commandParts[0], commandParts[1:]...)
	cwd, err := os.Getwd()
	if err != nil {
		return nil, err
	}
	subProcess.Dir = path.Join(cwd, "solver")
	res, err := subProcess.CombinedOutput()
	fmt.Println(string(res))
	if err != nil {
		return nil, err
	}
	return res, nil
}

func createQueryFile(query []byte) (*os.File, error) {
	tempfile, err := ioutil.TempFile("", "query")
	if err != nil {
		return nil, err
	}
	if _, err := tempfile.Write(query); err != nil {
		return nil, err
	}
	if err := tempfile.Close(); err != nil {
		return nil, err
	}
	return tempfile, nil
}
