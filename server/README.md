# Samorozvrh server

A webserver to serve the Samorozvrh webapp. After compiling with

```
go install github.com/src/github.com/iamwave/samorozvrh/server
```

start the server with

```
$GOPATH/bin/server
```

The command should be ran from the `samorozvrh` directory, or set the `--rootdir` argument to it. Use `--port` to specify the port.
