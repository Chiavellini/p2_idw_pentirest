#!/bin/bash

# ========================================
# Script de Validación de OpenGraph
# Pinterest Clone - Pinfinity
# ========================================

echo "🔍 Validando implementación de OpenGraph..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Función para verificar
check() {
    local description=$1
    local command=$2

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $description"
        ((FAILED++))
    fi
}

# Función para contar tags
count_tag() {
    local description=$1
    local pattern=$2
    local expected=$3

    count=$(grep -c "$pattern" index.html 2>/dev/null || echo "0")

    if [ "$count" -ge "$expected" ]; then
        echo -e "${GREEN}✅${NC} $description (encontrados: $count)"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $description (esperados: $expected, encontrados: $count)"
        ((FAILED++))
    fi
}

echo "📋 Verificando archivos..."
echo "─────────────────────────────────────────"

# Verificar archivos
check "index.html existe" "[ -f index.html ]"
check "OPENGRAPH_SETUP.md existe" "[ -f OPENGRAPH_SETUP.md ]"
check "og-image-template.html existe" "[ -f og-image-template.html ]"
check "README_OPENGRAPH.md existe" "[ -f README_OPENGRAPH.md ]"

echo ""
echo "🏷️  Verificando Meta Tags..."
echo "─────────────────────────────────────────"

# Verificar meta tags en index.html
count_tag "OpenGraph tags (og:)" "property=\"og:" 10
count_tag "Twitter Card tags" "name=\"twitter:" 5
count_tag "SEO meta tags" "name=\"description\"" 1
count_tag "Keywords" "name=\"keywords\"" 1
count_tag "Theme color" "name=\"theme-color\"" 1

echo ""
echo "🎨 Verificando contenido..."
echo "─────────────────────────────────────────"

# Verificar contenido específico
check "Título contiene 'Pinterest Clone'" "grep -q 'Pinterest Clone' index.html"
check "Idioma es es-MX" "grep -q 'lang=\"es-MX\"' index.html"
check "og:image definido" "grep -q 'og:image' index.html"
check "og:url definido" "grep -q 'og:url' index.html"
check "og:locale es es_MX" "grep -q 'og:locale.*es_MX' index.html"

echo ""
echo "📸 Verificando imagen og-image.jpg..."
echo "─────────────────────────────────────────"

if [ -f "public/og-image.jpg" ]; then
    echo -e "${GREEN}✅${NC} og-image.jpg existe en public/"

    # Verificar dimensiones si ImageMagick está instalado
    if command -v identify &> /dev/null; then
        DIMENSIONS=$(identify -format "%wx%h" public/og-image.jpg 2>/dev/null)
        if [ "$DIMENSIONS" = "1200x630" ]; then
            echo -e "${GREEN}✅${NC} Dimensiones correctas (1200x630)"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️${NC}  Dimensiones: $DIMENSIONS (recomendado: 1200x630)"
        fi

        SIZE=$(du -h public/og-image.jpg | cut -f1)
        echo -e "${GREEN}ℹ️${NC}  Tamaño: $SIZE"
    else
        echo -e "${YELLOW}ℹ️${NC}  ImageMagick no instalado, no se puede verificar dimensiones"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌${NC} og-image.jpg NO encontrado en public/"
    echo -e "${YELLOW}💡${NC} Crea la imagen y colócala en frontend/public/og-image.jpg"
    ((FAILED++))
fi

echo ""
echo "🌐 Verificando URLs..."
echo "─────────────────────────────────────────"

# Verificar si hay URLs placeholder
if grep -q "https://tu-dominio.com" index.html; then
    echo -e "${YELLOW}⚠️${NC}  URLs placeholder detectadas (https://tu-dominio.com)"
    echo -e "${YELLOW}💡${NC} Recuerda reemplazarlas con tu dominio real antes de deploy"
else
    echo -e "${GREEN}✅${NC} URLs actualizadas (no hay placeholders)"
    ((PASSED++))
fi

echo ""
echo "═════════════════════════════════════════"
echo "📊 RESUMEN"
echo "═════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Pasadas:${NC} $PASSED"
echo -e "${RED}❌ Fallidas:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todo listo! OpenGraph implementado correctamente${NC}"
    echo ""
    echo "📋 Próximos pasos:"
    echo "  1. Crear og-image.jpg (1200x630px)"
    echo "  2. Colocar en frontend/public/og-image.jpg"
    echo "  3. Reemplazar URLs placeholder con tu dominio"
    echo "  4. Deploy a producción"
    echo "  5. Probar con Facebook Debugger"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Hay elementos que necesitan atención${NC}"
    echo ""
    echo "📖 Consulta OPENGRAPH_SETUP.md para más detalles"
    echo ""
    exit 1
fi
