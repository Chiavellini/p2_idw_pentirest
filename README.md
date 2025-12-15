## Integrantes:

Bernardo del Río

_Resumen del Producto:_
Aplicación web tipo Pinterest que replica la experiencia de exploración y gestión de contenido visual, utilizando Vite + React en el frontend y FastAPI en el backend. La plataforma permite a los usuarios crear, editar, actualizar y eliminar posts propios (CRUD), así como consultar posts por ID mediante una API bien estructurada. Incluye una sección de “Descubrimiento” que obtiene imágenes aleatorias a través de la API de Unsplash, consumidas y transformadas desde la API propia para optimizar el render en el cliente. El sistema implementa Open Graph para generar vistas previas enriquecidas al compartir enlaces y utiliza localStorage y sessionStorage para gestionar el estado del usuario, controlando qué posts puede editar y optimizando la carga inicial del feed en la primera visita. En conjunto, el proyecto demuestra una arquitectura moderna, eficiente y orientada a una experiencia de usuario fluida.

## Front-end:

**Requisitos:**

1. Instalar Node.js (versión 18 o superior): https://nodejs.org/

**Instrucciones para levantar el frontend:**

1. Navegar a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir el navegador en la URL que aparece en la terminal (generalmente http://localhost:5173)

## Backend:

**Requisitos:**

1. Instalar Python (versión 3.9 o superior): https://www.python.org/downloads/

**Instrucciones para levantar el backend:**

1. Navegar a la carpeta raíz del proyecto:
   ```bash
   cd /ruta/al/proyecto/p2_idw_pentirest
   ```
2. Crear un entorno virtual:
   ```bash
   python -m venv .venv
   ```
3. Activar el entorno virtual:
   - En macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - En Windows:
     ```bash
     .venv\Scripts\activate
     ```
4. Instalar las dependencias del proyecto:
   ```bash
   pip install -r requirements.txt
   ```
5. Configurar variables de entorno:
   - Crear un archivo `.env` dentro de la carpeta `backend/`
   - Agregar tu API key de Unsplash:
     ```
     UNSPLASH_ACCESS_KEY=tu_api_key_aqui
     ```
   - Puedes obtener API key gratis en: https://unsplash.com/developers
6. Iniciar el servidor de desarrollo:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
7. El servidor estará disponible en http://127.0.0.1:8000
   - Documentación interactiva (Swagger): http://127.0.0.1:8000/docs

## health endpoint:

http://127.0.0.1:8000/
