
# FRASES ÉPICAS — ZONA GAMER

Aplicación web interactiva con estética **Cyberpunk / Dark Mode Arcade**, desarrollada para registrar, explorar, filtrar y votar citas célebres de videojuegos, películas, series, deportes y cultura popular. Todo el almacenamiento relacional se ejecuta directamente en el navegador mediante **SQLite compilado a WebAssembly (`sql.js`)** con persistencia binaria en `localStorage`.

---

## Características Principales

- **Autenticación y Seguridad de Sesiones:** Pantalla obligatoria de registro e inicio de sesión al ingresar o recargar la página (`F5`), protegiendo la privacidad de los perfiles registrados sin exponer cuentas de terceros.
- **Operaciones CRUD Completas en SQLite:** Creación, lectura, actualización y eliminación de frases en tiempo real mediante consultas SQL parametrizadas.
- **Control de Propiedad (`creado_por`):** Únicamente el usuario que publicó una frase puede editarla o eliminarla; las frases de otros jugadores muestran su autoría y permiten exclusivamente la votación.
- **Sistema de Votación y Cooldown Temporal:** Cada jugador cuenta con un límite de **10 votos por frase** dentro de un ciclo de recarga temporal con temporizador en vivo en la interfaz, otorgando puntos de experiencia (**XP**) y subida de nivel progresiva.
- **Ranking Dinámico en Tiempo Real:**
  - **Banner Líder (#1):** Destaca automáticamente la frase con mayor puntuación global.
  - **Salón de la Fama (Top 10):** Tabla de posiciones ordenada descendentemente mediante `ORDER BY votos DESC`.
- **Búsqueda y Filtrado Instantáneo:** Filtrado por categorías desde el menú lateral o selector superior y búsqueda en tiempo real mediante consultas `SQL LIKE`.

---

## Funcionamiento de la Persistencia Local

El motor relacional de **FRASES ÉPICAS** ejecuta SQLite íntegramente en la memoria del navegador mediante WebAssembly (`sql.js`). Cada vez que el usuario realiza una operación de escritura (`INSERT`, `UPDATE` o `DELETE`), la base de datos se exporta como un arreglo binario (`Uint8Array`) y se almacena de forma automática en `localStorage`.

> **Nota importante:** Debido a que la persistencia ocurre en el almacenamiento local del navegador, los registros, cuentas creadas y puntuaciones se conservan al recargar o cerrar la pestaña en el mismo dispositivo, sin sincronización automática entre navegadores o equipos distintos.

---

## Propósito del Proyecto

**FRASES ÉPICAS** nace con el propósito de transformar la gestión tradicional de registros en una experiencia recreativa digital envolvente. En lugar de presentar un formulario estático convencional, la plataforma convierte cada cita icónica en una pieza coleccionable que compite por alcanzar los primeros puestos del Salón de la Fama gracias a la interacción y el sistema de votación de la comunidad.

> *"Las partidas terminan, las frases épicas permanecen."* 👾

---

## Arquitectura del Proyecto (Patrón MVC)

El código está estructurado de forma modular siguiendo el patrón **Modelo-Vista-Controlador (MVC)** en TypeScript:

```text
arcade-frases-sqlite/
├── public/                 # Recursos estáticos e iconos
├── src/
│   ├── controllers/
│   │   └── FraseController.ts   # Orquestación de eventos, sesión y flujo de datos
│   ├── db/
│   │   └── database.ts          # Conexión SQL.js (WASM), esquema de tablas y exportación binaria
│   ├── models/
│   │   └── Frase.ts             # Consultas SQL (CRUD, autenticación, cooldowns y XP)
│   ├── styles/
│   │   └── styles.css           # Diseño responsive Dark Mode, efectos neón y modales
│   ├── views/
│   │   └── FraseView.ts         # Renderizado dinámico del DOM y temporizadores en vivo
│   └── main.ts                  # Punto de entrada de la aplicación
├── index.html              # Estructura semántica y carga del motor WASM
├── package.json            # Dependencias y scripts de compilación
├── tsconfig.json           # Configuración estricta de TypeScript
└── vite.config.ts          # Configuración del empaquetador Vite

Cómo Ejecutar el Proyecto Localmente
Clona el repositorio:
git clone [https://github.com/Juanh3rn4nd3z/arcade-frases-sqlite.git](https://github.com/Juanh3rn4nd3z/arcade-frases-sqlite.git)
cd arcade-frases-sqlite

Instala las dependencias:
npm install

Inicia el servidor de desarrollo:
npm run dev
Abre la aplicación en tu navegador:
Ingresa a http://localhost:5173.

Autor
Proyecto desarrollado por Juan René Flores Hernández.
