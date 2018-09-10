# Frontend of the Samorozvrh

## Webpack

Frontend lze zkompilovat ve dvou režimech - development a production.

```
npm run dev
npm run prod
```

Pro vývoj lze nechat webpack, aby hlídal změny souborů a kompiloval průběžně.

```
npm run watch
```

## TODOs

- třídě `Group` chybí id - vue nadává, když kompiluje `v-for` cykly
    - taky `Course` by mohl mít nějaké chytré id, ale nevím co poskytuje sis -- Jirka
