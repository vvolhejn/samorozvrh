# samorozvrh
Automatická tvorba rozvhu pro studenty Univerzity Karlovy

## Instalace

Server je napsaný v Go, solver v Pythonu 3 (takže moc instalace nepotřebuje).

Standard Go je mít všechny projekty na jednom místě. Bohužel, protože je tento projekt vícejazyčný, znamená to, že musíme všechno nainstalovat na místo, kde to očekává Go. Proto je potřeba projekt `git clone`ovat do složky
```
$GOPATH/src/github.com/iamwave/samorozvrh
```

Frontend vyžaduje webpack, který zase vyžaduje NPM. Lze nainstalovat přes
```
npm install webpack
```

Pak by k instalaci teoreticky mělo stačit spustit z kořenové složky projektu `make`.
To nainstaluje solver, (Pipenv a Google OR Tools), server (kompilace Go kódu) i frontend (webpackování JS do jednoho souboru).

## Spouštění

Server je potřeba spouštět z kořene projektu, tj. `$GOPATH/src/github.com/iamwave/samorozvrh`.
Cesty ke zdrojům, jako statické stránky a umístění solveru, jsou totiž relativní.
Server zapneme tímto příkazem:
```
$GOPATH/bin/server
```
