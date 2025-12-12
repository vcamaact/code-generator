# Code Generator AI con CODEX

Generador de código inteligente que utiliza GPT-4 para modificar archivos automáticamente, creando ramas Git, commiteando y pusheando cambios.

## Características

- 🤖 **Modificación automática de código** usando GPT-4
- 🔀 **Gestión automática de Git**: crea ramas, commits y push
- 🎨 **Interfaz moderna** con efectos glassmorphism
- 📝 **Análisis inteligente** de prompts para identificar archivos a modificar
- ✅ **Validación de código** antes de aplicar cambios

## Requisitos Previos

- Node.js 18+ 
- Git configurado
- Cuenta de OpenAI con API key
- GitHub Personal Access Token (para auto-push)

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
OPENAI_API_KEY=tu_api_key_de_openai
GITHUB_TOKEN=tu_github_personal_access_token
GIT_DEFAULT_BRANCH=main
```

### 3. Configurar Git Remote

```bash
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Code Modifier

1. Navega a `/code-modifier`
2. Describe los cambios que necesitas en el prompt
3. Configura las opciones:
   - **Auto-commit**: Commitea automáticamente los cambios
   - **Auto-push**: Pushea los cambios al repositorio remoto
4. Haz clic en "Modificar Código"

El sistema:
- Analizará tu prompt con GPT-4
- Identificará qué archivos modificar
- Creará una nueva rama (formato: `codex-{timestamp}-{descripción}`)
- Aplicará los cambios solicitados
- Commiteará los cambios (si está habilitado)
- Pusheará al remoto (si está habilitado)

### Ejemplos de Prompts

```
"Agrega un componente Button en src/components con variantes primary y secondary"

"Modifica el archivo page.tsx para agregar un título con el texto 'Bienvenido'"

"Crea un nuevo archivo utils.ts en src/lib con una función para formatear fechas"

"Agrega validación de email al formulario en src/app/login/page.tsx"
```

## Arquitectura

### Backend

- **GitService** (`src/lib/GitService.ts`): Maneja operaciones Git
  - Crear ramas
  - Leer/escribir archivos
  - Commits
  - Push con autenticación

- **CodexService** (`src/lib/CodexService.ts`): Integración con OpenAI
  - Análisis de prompts
  - Generación de código
  - Validación de sintaxis
  - Generación de mensajes de commit

- **API Route** (`src/app/api/code-modify/route.ts`): Endpoint principal
  - Orquesta el flujo completo
  - Maneja errores
  - Retorna resultados

### Frontend

- **Code Modifier Page** (`src/app/code-modifier/page.tsx`): Interfaz principal
  - Formulario de prompts
  - Configuración de opciones Git
  - Visualización de resultados

## Seguridad

- ⚠️ **IMPORTANTE**: Nunca commitees tu archivo `.env.local`
- El GitHub Token debe tener permisos de `repo` para push
- Se recomienda usar tokens con permisos mínimos necesarios

## Tecnologías

- **Next.js 16** - Framework React
- **TypeScript** - Type safety
- **OpenAI GPT-4** - Generación de código
- **simple-git** - Operaciones Git
- **Heroicons** - Iconos
- **Tailwind CSS 4** - Estilos

## Troubleshooting

### Error: "Failed to push"

- Verifica que el `GITHUB_TOKEN` esté configurado correctamente
- Confirma que el token tenga permisos de `repo`
- Asegúrate de que el remote esté configurado

### Error: "Failed to create branch"

- Verifica que Git esté inicializado en el proyecto
- Confirma que no haya cambios sin commitear en la rama actual

### Error: "OpenAI API error"

- Verifica que tu `OPENAI_API_KEY` sea válida
- Confirma que tengas créditos disponibles en tu cuenta de OpenAI
- Revisa que estés usando un modelo disponible (gpt-4)

## Licencia

MIT
