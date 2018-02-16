# Samorozvrh
Automatická tvorba rozvhu pro studenty Univerzity Karlovy

## Instalace
Instalace předpokládá, že je nainstalované Go.

```
go get github.com/src/github.com/iamwave/samorozvrh/server
```

Tím se projekt `git clone`uje do `$GOPATH/src/github.com/iamwave/samorozvrh` a zkompiluje se Go kód.

Solver vyžaduje **Python 3**.
Frontend vyžaduje **Webpack**, který zase vyžaduje **npm**. Webpack lze nainstalovat přes

```
npm install webpack
```

Pak by k instalaci teoreticky mělo stačit spustit z kořenové složky projektu `make`.
To nainstaluje solver, (Pipenv a Google OR Tools), server (kompilace Go kódu) i frontend (webpackování JS do jednoho souboru).

## Spouštění

```
$GOPATH/bin/server
```

Server je potřeba spouštět z kořene projektu, tj. `$GOPATH/src/github.com/iamwave/samorozvrh`, nebo zadat tuto cestu jako argument `-rootdir`.
Cesty ke zdrojům, jako statické stránky a umístění solveru, jsou totiž relativní.

## Dokumentace

Podrobněji je fungování popsáno v [DOC.md](./DOC.md).
