package main

import (
	"io/ioutil"
	"os"
	"path"
)

func isCached(name []string) bool {
	if _, err := os.Stat(getCacheFilename(name)); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}

func setCache(name []string, data string) error {
	err := os.MkdirAll(path.Dir(getCacheFilename(name)), 0755)
	if err != nil {
		return err
	}
	filename := getCacheFilename(name)
	return ioutil.WriteFile(filename, []byte(data), 0644)
}

func getCache(name []string) (string, error) {
	filename := getCacheFilename(name)
	res, err := ioutil.ReadFile(filename)
	return string(res), err
}

func getCacheFilename(name []string) string {
	return path.Join(append([]string{rootDir, "cache"}, name...)...)
}
