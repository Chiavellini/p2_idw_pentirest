from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3
import os
from dotenv import load_dotenv
import requests

# Cargar variables de entorno desde .env
load_dotenv()

# Instancia de FastAPI
app = FastAPI(
    title="Pinterest Clone API",
    description="API para clon de Pinterest con posts e integración Unsplash",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen. Cambiar en producción.
    allow_methods=["*"],
    allow_headers=["*"],  # Permite todos los headers
)

# ============================================================================
# MODELOS DE DATOS (Schemas con Pydantic)
# ============================================================================


class Post(BaseModel):
    id: int
    usuario: str
    link_imagen: str
    fecha_alta: datetime
    etiquetas: List[str] = []  # Lista de tags para categorizar el post


class PostCreate(BaseModel):
    usuario: str
    link_imagen: str
    etiquetas: Optional[List[str]] = []  # Opcional, default lista vacía


class PostUpdate(BaseModel):
    usuario: Optional[str] = None
    link_imagen: Optional[str] = None
    etiquetas: Optional[List[str]] = None


class PostsPaginados(BaseModel):
    total: int  # Total de posts en la DB
    page: int  # Página actual
    limit: int  # Posts por página
    posts: List[Post]  # Lista de posts de esta página


class UnsplashPhoto(BaseModel):
    id: str
    url: str
    author: str
    alt_description: Optional[str] = None

# ============================================================================
# CONFIGURACIÓN DE BASE DE DATOS (SQLite)
# ============================================================================


# Ruta del archivo de base de datos
DB_PATH = "data/posts.db"

# Crear carpeta data si no existe
os.makedirs("data", exist_ok=True)


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Crear tabla posts
    # etiquetas se guarda como JSON string (lo convertimos después)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT NOT NULL,
            link_imagen TEXT NOT NULL,
            fecha_alta TEXT NOT NULL,
            etiquetas TEXT
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Base de datos inicializada")


def get_db_connection():
    """
    Crea y retorna una conexión a la base de datos
    row_factory permite acceder a columnas por nombre
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Para acceder como diccionario
    return conn

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================


def etiquetas_to_json(etiquetas: List[str]) -> str:
    """
    Convierte lista de etiquetas a string JSON para guardar en SQLite
    """
    import json
    return json.dumps(etiquetas)


def json_to_etiquetas(json_str: str) -> List[str]:
    """
    Convierte string JSON a lista de etiquetas
    """
    import json
    if not json_str:
        return []
    return json.loads(json_str)

# ============================================================================
# API UNSPLASH
# ============================================================================


def fetch_unsplash_photos(count: int = 10) -> List[UnsplashPhoto]:
    """
    Llama a la API de Unsplash y transforma la respuesta
    Solo devuelve los datos necesarios para el frontend
    """
    # Obtener API key desde variables de entorno
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="API key de Unsplash no configurada"
        )

    # Endpoint de Unsplash para fotos aleatorias
    url = "https://api.unsplash.com/photos/random"

    # Parámetros de la petición
    params = {
        "count": count,  # Número de fotos
        "client_id": api_key
    }

    try:
        # Hacer la petición a Unsplash
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()  # Lanza excepción si hay error HTTP

        # Obtener datos JSON
        data = response.json()

        # Transformar respuesta: solo extraer lo necesario
        photos = []
        for item in data:
            photos.append(UnsplashPhoto(
                id=item["id"],
                url=item["urls"]["regular"],  # URL de imagen en calidad media
                author=item["user"]["name"],
                alt_description=item.get("alt_description", "")
            ))

        return photos

    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al conectar con Unsplash: {str(e)}"
        )

# ============================================================================
# EVENTOS DE INICIO Y CIERRE
# ============================================================================


@app.on_event("startup")
def startup():
    """
    Se ejecuta cuando arranca el servidor
    """
    init_db()


@app.on_event("shutdown")
def shutdown():
    """
    Se ejecuta cuando se cierra el servidor
    """
    print("👋 Cerrando aplicación")

# ============================================================================
# ENDPOINTS
# ============================================================================

# Endpoint raíz - Health check


@app.get("/")
def health():
    """
    Verificar que la API está funcionando
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM posts")
    count = cursor.fetchone()[0]
    conn.close()

    return {
        "ok": True,
        "message": "Pinterest Clone API",
        "total_posts": count,
        "docs": "/docs"
    }

# Favicon endpoint - previene 404 en logs


@app.get("/favicon.ico")
def favicon():
    """
    Endpoint para favicon - evita errores 404 en logs del navegador
    """
    from fastapi.responses import Response
    return Response(status_code=204)

# GET - Listado de posts con paginación


@app.get("/api/posts", response_model=PostsPaginados)
def listar_posts(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=100, description="Posts por página"),
    min_date: Optional[str] = Query(
        None, description="Fecha mínima ISO (para LocalStorage)")
):
    """
    Obtener lista de posts con paginación

    - page: número de página (default: 1)
    - limit: posts por página (default: 10, max: 100)
    - min_date: filtrar posts creados después de esta fecha (opcional)
                formato ISO: "2024-12-14T10:30:00"

    Retorna:
    - total: total de posts en la DB
    - page: página actual
    - limit: posts por página
    - posts: lista de posts
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Calcular offset para paginación
    offset = (page - 1) * limit

    # Query base
    query = "SELECT * FROM posts"
    params = []

    # Si se proporciona min_date, filtrar
    if min_date:
        query += " WHERE fecha_alta > ?"
        params.append(min_date)

    # Ordenar por fecha (más recientes primero) y aplicar paginación
    query += " ORDER BY fecha_alta DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    # Ejecutar query
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Contar total de posts (para paginación)
    count_query = "SELECT COUNT(*) FROM posts"
    if min_date:
        count_query += " WHERE fecha_alta > ?"
        cursor.execute(count_query, [min_date])
    else:
        cursor.execute(count_query)

    total = cursor.fetchone()[0]
    conn.close()

    # Convertir rows a objetos Post
    posts = []
    for row in rows:
        posts.append(Post(
            id=row["id"],
            usuario=row["usuario"],
            link_imagen=row["link_imagen"],
            fecha_alta=datetime.fromisoformat(row["fecha_alta"]),
            etiquetas=json_to_etiquetas(row["etiquetas"])
        ))

    return PostsPaginados(
        total=total,
        page=page,
        limit=limit,
        posts=posts
    )

# GET - Obtener un post por ID


@app.get("/api/posts/{post_id}", response_model=Post)
def obtener_post(post_id: int):
    """
    Obtener un post específico por su ID

    Retorna 404 si no existe
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Post no encontrado")

    return Post(
        id=row["id"],
        usuario=row["usuario"],
        link_imagen=row["link_imagen"],
        fecha_alta=datetime.fromisoformat(row["fecha_alta"]),
        etiquetas=json_to_etiquetas(row["etiquetas"])
    )

# POST - Crear nuevo post


@app.post("/api/posts", response_model=Post, status_code=201)
def crear_post(post: PostCreate):
    """
    Crear un nuevo post

    Campos requeridos:
    - usuario: nombre del usuario
    - link_imagen: URL de la imagen

    Campos opcionales:
    - etiquetas: lista de tags

    La fecha se genera automáticamente en el servidor
    """
    # Validar campos obligatorios
    if not post.usuario.strip():
        raise HTTPException(
            status_code=400, detail="El usuario es obligatorio")

    if not post.link_imagen.strip():
        raise HTTPException(
            status_code=400, detail="El link de imagen es obligatorio")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fecha actual en formato ISO
    fecha_alta = datetime.utcnow().isoformat()

    # Convertir etiquetas a JSON string
    etiquetas_json = etiquetas_to_json(post.etiquetas)

    # Insertar en la base de datos
    cursor.execute('''
        INSERT INTO posts (usuario, link_imagen, fecha_alta, etiquetas)
        VALUES (?, ?, ?, ?)
    ''', (post.usuario, post.link_imagen, fecha_alta, etiquetas_json))

    # Obtener el ID del post recién creado
    post_id = cursor.lastrowid

    conn.commit()
    conn.close()

    # Retornar el post creado
    return Post(
        id=post_id,
        usuario=post.usuario,
        link_imagen=post.link_imagen,
        fecha_alta=datetime.fromisoformat(fecha_alta),
        etiquetas=post.etiquetas
    )

# PUT - Actualizar post existente


@app.put("/api/posts/{post_id}", response_model=Post)
def actualizar_post(post_id: int, post: PostUpdate, x_user: Optional[str] = Header(None, alias="X-User")):
    """
    Actualizar un post existente

    Todos los campos son opcionales (actualización parcial)
    - usuario
    - link_imagen
    - etiquetas

    Requiere header X-User con el nombre del usuario que creó el post.
    Retorna 404 si el post no existe
    Retorna 403 si el usuario no es el creador del post
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar que el post existe
    cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Post no encontrado")

    # Verificar autorización: el usuario debe ser el creador del post
    if not x_user:
        conn.close()
        raise HTTPException(
            status_code=401,
            detail="Header X-User requerido para modificar posts"
        )

    if row["usuario"] != x_user:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para modificar este post. Solo el usuario que lo creó puede modificarlo."
        )

    # Preparar campos a actualizar
    updates = []
    params = []

    if post.usuario is not None:
        updates.append("usuario = ?")
        params.append(post.usuario)

    if post.link_imagen is not None:
        updates.append("link_imagen = ?")
        params.append(post.link_imagen)

    if post.etiquetas is not None:
        updates.append("etiquetas = ?")
        params.append(etiquetas_to_json(post.etiquetas))

    # Si no hay nada que actualizar
    if not updates:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="No se proporcionaron campos para actualizar"
        )

    # Construir query de actualización
    query = f"UPDATE posts SET {', '.join(updates)} WHERE id = ?"
    params.append(post_id)

    cursor.execute(query, params)
    conn.commit()

    # Obtener el post actualizado
    cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return Post(
        id=updated_row["id"],
        usuario=updated_row["usuario"],
        link_imagen=updated_row["link_imagen"],
        fecha_alta=datetime.fromisoformat(updated_row["fecha_alta"]),
        etiquetas=json_to_etiquetas(updated_row["etiquetas"])
    )

# DELETE - Eliminar post


@app.delete("/api/posts/{post_id}", status_code=204)
def eliminar_post(post_id: int, x_user: Optional[str] = Header(None, alias="X-User")):
    """
    Eliminar un post por su ID

    Requiere header X-User con el nombre del usuario que creó el post.
    Retorna 204 No Content si se elimina correctamente
    Retorna 404 si el post no existe
    Retorna 403 si el usuario no es el creador del post
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar que existe antes de eliminar
    cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Post no encontrado")

    # Verificar autorización: el usuario debe ser el creador del post
    if not x_user:
        conn.close()
        raise HTTPException(
            status_code=401,
            detail="Header X-User requerido para eliminar posts"
        )

    if row["usuario"] != x_user:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para eliminar este post. Solo el usuario que lo creó puede eliminarlo."
        )

    # Eliminar el post
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()

    # 204 No Content (sin body en la respuesta)
    return None

# GET - Discovery (Fotos de Unsplash)


@app.get("/api/discovery", response_model=List[UnsplashPhoto])
def get_discovery(count: int = Query(10, ge=1, le=30, description="Número de fotos")):
    """
    Obtener fotos aleatorias de Unsplash para la sección de descubrimiento

    - count: número de fotos a obtener (default: 10, max: 30)

    Esta ruta llama a la API de Unsplash y transforma la respuesta
    para devolver solo los datos necesarios para el frontend
    """
    return fetch_unsplash_photos(count)
