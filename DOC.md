# Dokumentace

Samorozvrh má čtyři základní části:

- **server**: HTTP server, který spojuje ostatní části dohromady. Servuje
    frontend a ještě otevírá API pro volání **sisparse** a **solver**u po HTTP.
- **frontend**: Uživatelské rozhraní - webová aplikace, kterou vidí koncový
    uživatel. Zařizuje zobrazování a umožňuje uživateli volání funkcí serveru.
- **solver**: Dostane informace o předmětech a vrátí informace o tom, které
    předměty a paralelky zapsat, aby maximalizoval funkci zisku.
- **sisparse**: Modul, který implementuje jedinou funkci: `GetCourseEvents()`,
    která dostane kód předmětu v SISu, vyparsuje SIS a vrátí získané informace
    o tomto předmětu.

Typický workflow je tedy takovýto:

- (Administrátor zapne **server**.)
- Uživatel pomocí tlačítka "Přidat" přidá předměty, které si chce zapsat.
    Při zmáčknutí tlačítka se stane:
    - **frontend** pošle HTTP dotaz na `./sisquery`
    - **server** při servování URL `./sisquery/<kod>` zavolá **sisparse**
        s kódem předmětu `<kod>`.
    - **sisparse** načte příslušnou stránku SISu a vyparsuje z ní data
        o předmětu
    - výsledek ze **sisparse** odešle **server** jako JSON a ten **frontend**
        zpracuje a zobrazí uživateli
- Zmáčkne "Sestavit rozvrh". Stane se:
    - **frontend** zakóduje uživatelem navolené podmínky do JSONu a pošle je
        jako tělo HTTP POST requestu na `./solverquery`.
    - **server** tyto data uloží jako dočasný soubor a zavolá na něj **solver**
    - **solver** a jejich základě vytvoří co nejlepší vyhovující rozvrh
    - Vrácenou volbu **server** pošle jako odpověď na HTTP request
    - **frontend** odpověď zpracuje a zobrazí uživateli jako rozvrh


## Server

- Jazyk: Go
- API funkce (volá **frontend** pomocí HTTP requestů):
    - `server/main.go:sisQueryHandler()` - zavolá **sisparse**
    - `server/main.go:solverQueryHandler()` - zavolá **solver**
        - samotné volání solveru je v `server/solver.go:Solve()`


## Frontend

- Jazyk: JS, HTML (+Handlebars), CSS
- Vstupní funkce (zavolané při uživatelkém vstupu):
    - `frontend/src/app.js:addCourse()` - při tlačítku "Přidat" (předmět) 
    - `frontend/src/app.js:createSchedule()` - při tlačítku "Sestavit rozvrh"


## Solver

- Jazyk: Python
- Na řešení používá [Google OR Tools](https://developers.google.com/optimization/)
- Formát JSONů, se kterými pracuje solver, je popsán v [solver/README.md](./solver/README.md).
- **server** volá **solver** přes shell jako Pythonový skript
    - argumentem je vstupní soubor, výstup jde na stdout
- Vstupní funkce: `solver/solver/main.py:main()`
- Lze volat i samostatně, např: `cd solver && ./run.sh --debug fixtures/example.json`


## Sisparse

- Jazyk: Go
- API funkce:
    - `GetCourseEvents()` - volá ji **server**
