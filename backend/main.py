from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3
import os
from dotenv import load_dotenv
import requests
import json

# Cargar variables de entorno desde .env
load_dotenv()

app = FastAPI(title="Pinfinity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# MODELOS DE DATOS (Schemas con Pydantic)

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


# ----------------------------------------------------------------------------
# CONFIGURACIÓN DE BASE DE DATOS (SQLite)


# Ruta del archivo de base de datos
DB_PATH = "data/posts.db"

# Crear carpeta data si no existe
os.makedirs("data", exist_ok=True)


def init_db():
    conexion = sqlite3.connect(DB_PATH)
    cursor = conexion.cursor()

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

    conexion.commit()
    conexion.close()
    print("Base de datos inicializada correctamente")


def get_db_connection():
    conexion = sqlite3.connect(DB_PATH)
    conexion.row_factory = sqlite3.Row  # Para acceder como diccionario
    return conexion

# ----------------------------------------------------------------------------
# FUNCIONES AUXILIARES


# Convertir lista de etiquetas a string JSON para guardar en SQLite
def etiquetas_to_json(etiquetas: List[str]) -> str:
    return json.dumps(etiquetas)


# Convertir string JSON a lista de etiquetas
def json_to_etiquetas(json_str: str) -> List[str]:
    if not json_str:
        return []
    return json.loads(json_str)


# Convertir fila de BD a objeto Post
def row_to_post(row: sqlite3.Row) -> Post:
    return Post(
        id=row["id"],
        usuario=row["usuario"],
        link_imagen=row["link_imagen"],
        fecha_alta=datetime.fromisoformat(row["fecha_alta"]),
        etiquetas=json_to_etiquetas(row["etiquetas"])
    )


# Obtener post por ID y verificar que existe
def get_post_by_id_or_404(conexion: sqlite3.Connection, post_id: int) -> sqlite3.Row:
    cursor = conexion.cursor()
    cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Post no encontrado")

    return row


# Verificar autorización: el usuario debe ser el creador del post
def verify_post_ownership(row: sqlite3.Row, x_user: Optional[str]) -> None:
    if not x_user:
        raise HTTPException(
            status_code=401,
            detail="Header X-User requerido para modificar posts"
        )

    if row["usuario"] != x_user:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para modificar este post. Solo el usuario que lo creó puede modificarlo."
        )

# ----------------------------------------------------------------------------
# API UNSPLASH


def fetch_unsplash_photos(count: int = 10) -> List[UnsplashPhoto]:
    # Obtener API key desde env
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="API key de Unsplash no configurada"
        )

    # Endpoint de Unsplash para fotos aleatorias
    url = "https://api.unsplash.com/photos/random"

    # Parámetros de petición
    params = {
        "count": count,  # Número de fotos
        "client_id": api_key
    }

    try:
        # Petición a Unsplash
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()  # Lanza excepción si hay error HTTP

        data = response.json()

        # Transformar respuesta: solo extraer lo necesario
        photos = []
        for item in data:
            photos.append(UnsplashPhoto(
                id=item["id"],
                url=item["urls"]["regular"],
                author=item["user"]["name"],
                alt_description=item.get("alt_description", "")
            ))

        return photos

    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al conectar con Unsplash: {str(e)}"
        )

# ----------------------------------------------------------------------------
# EVENTOS DE INICIO Y CIERRE


@app.on_event("startup")
def startup():
    init_db()


@app.on_event("shutdown")
def shutdown():
    print("👋 Cerrando aplicación")

# ----------------------------------------------------------------------------
# ENDPOINTS


# health check endpoint
@app.get("/")
def health():
    conexion = get_db_connection()
    cursor = conexion.cursor()
    cursor.execute("SELECT COUNT(*) FROM posts")
    count = cursor.fetchone()[0]
    conexion.close()

    return {
        "ok": True,
        "message": "Pinterest Clone API",
        "total_posts": count,
        "docs": "/docs"
    }


# Favicon endpoint (evitar error 404 en logs del navegador)
@app.get("/favicon.ico")
def favicon():
    """
    Endpoint para favicon - evita errores 404 en logs del navegador
    """
    from fastapi.responses import Response
    return Response(status_code=204)


# GET - Listado de posts con paginación
@app.get("/api/posts", response_model=PostsPaginados)
def listar_posts(page: int = Query(1, ge=1, description="Número de página"), limit: int = Query(10, ge=1, le=100, description="Posts por página"), min_date: Optional[str] = Query(None, description="Fecha mínima ISO (para LocalStorage)")):
    conexion = get_db_connection()
    cursor = conexion.cursor()

    # offset (gnora los primeros X posts y dame los siguientes Y)
    offset = (page - 1) * limit

    # obtener posts de bd
    query = "SELECT * FROM posts"
    params = []
    if min_date:
        query += " WHERE fecha_alta > ?"
        params.append(min_date)
    query += " ORDER BY fecha_alta DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Contar total
    count_query = "SELECT COUNT(*) FROM posts"
    if min_date:
        cursor.execute(count_query + " WHERE fecha_alta > ?", [min_date])
    else:
        cursor.execute(count_query)
    total = cursor.fetchone()[0]

    conexion.close()

    # Convertir a objetos Post
    posts = [row_to_post(row) for row in rows]

    return PostsPaginados(total=total, page=page, limit=limit, posts=posts)


# GET - Obtener un post por ID
@app.get("/api/posts/{post_id}", response_model=Post)
def get_post(post_id: int):
    conexion = get_db_connection()
    row = get_post_by_id_or_404(conexion, post_id)
    conexion.close()

    return row_to_post(row)


# POST - Crear nuevo post
@app.post("/api/posts", response_model=Post, status_code=201)
def crear_post(post: PostCreate):
    # Validacion con errores (400 Bad Request)
    if not post.usuario.strip():
        raise HTTPException(
            status_code=400, detail="El usuario es obligatorio")

    if not post.link_imagen.strip():
        raise HTTPException(
            status_code=400, detail="El link de imagen es obligatorio")

    conexion = get_db_connection()
    cursor = conexion.cursor()

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

    conexion.commit()
    conexion.close()

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
    conexion = get_db_connection()
    cursor = conexion.cursor()

    # Verificar que post existe y que el usuario tiene permiso
    row = get_post_by_id_or_404(conexion, post_id)
    verify_post_ownership(row, x_user)

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
        conexion.close()
        raise HTTPException(
            status_code=400,
            detail="No se proporcionaron campos para actualizar"
        )

    # Construir query de actualización
    query = f"UPDATE posts SET {', '.join(updates)} WHERE id = ?"
    params.append(post_id)

    cursor.execute(query, params)
    conexion.commit()

    # Obtener el post actualizado
    cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
    updated_row = cursor.fetchone()
    conexion.close()

    # Return post actualizado
    return row_to_post(updated_row)


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
    conexion = get_db_connection()
    cursor = conexion.cursor()

    # Verificar que post existe y que el usuario tiene permiso
    row = get_post_by_id_or_404(conexion, post_id)
    verify_post_ownership(row, x_user)

    # Eliminar el post
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conexion.commit()
    conexion.close()

    # 204 No Content (sin body en la respuesta)
    return None


# GET - Discovery (unsplash)
@app.get("/api/discovery", response_model=List[UnsplashPhoto])
def get_discovery(count: int = Query(10, ge=1, le=30, description="Número de fotos")):
    return fetch_unsplash_photos(count)
