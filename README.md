# Flucastr Memory AI — F01

## Requisitos verificados

- Node.js **22.23.2** (rango del proyecto: `>=22.23.2 <23`)
- npm **10.9.8**
- TypeScript **5.9.3** y `@types/node` **22.19.15**, instalados desde el lockfile.

## Instalar y verificar

Desde la raíz del repositorio:

```sh
npm ci
npm run verify
```

`verify` ejecuta, en orden, `typecheck`, `build`, `test`, ayuda CLI y `doctor`, unidos con `&&`: cualquier error detiene la cadena y propaga un estado no cero. Los tests usan el runner incorporado de Node.

El núcleo se importa así (después de compilar):

```js
import { probeSqlite } from 'flucastr-memory-ai';
console.log(probeSqlite());
```

La CLI puede ejecutarse con `npm run cli -- --help` o `npm run cli -- doctor`. Doctor informa como JSON la versión SQLite y disponibilidad de FTS5 en una base de datos temporal en memoria. No valida persistencia ni comportamiento de producto. Node advierte que `node:sqlite` es experimental y puede cambiar. Esta base F01 no ofrece comandos para guardar o buscar recuerdos.

## Evidencia por entorno

| Entorno | Runtime/OS observados | Resultado |
|---|---|---|
| Linux bajo WSL2, x86_64 | Node 22.23.2, npm 10.9.8; kernel `6.18.54.1-microsoft-standard-WSL2` | Verificación local ejecutada; resultado registrado en la tarea F01 task-04. Solo acredita este entorno observado. |
| macOS | No observado; no se tuvo acceso a un equipo macOS | No ejecutado; compatibilidad pendiente. No se atribuye compatibilidad a ningún chip. |

Receta idéntica para cada entorno disponible: instalar Node 22.23.2 y npm 10.9.8, clonar el repositorio, entrar en su raíz y ejecutar `npm ci` seguido de `npm run verify`. No instalar infraestructura adicional. La matriz solo se actualiza con ejecución real en el entorno correspondiente.

## Límite respecto de F02

F02 y su corpus, baseline y gate funcional no están implementados ni validados. La sonda temporal vacía y el diagnóstico F01 no constituyen evidencia del gate real de F02.
