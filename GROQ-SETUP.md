# Configuración con Groq (GRATIS)

## Paso 1: Obtén tu API Key de Groq

1. Ve a: **https://console.groq.com/keys**
2. Crea una cuenta (es gratis)
3. Genera una nueva API key
4. Copia la API key

## Paso 2: Configura la variable de entorno

Abre `.env.local` y agrega:

```env
GROQ_API_KEY=gsk_tu_api_key_aqui
GITHUB_TOKEN=tu_github_token_aqui
```

## Paso 3: Prueba que funciona

Ejecuta:

```bash
node test-groq.js
```

Deberías ver:

```
✅ Groq is working!
🎉 Your Code Modifier is ready to use with Groq!
```

## Paso 4: Usa el Code Modifier

1. El servidor ya debería estar corriendo (npm run dev)
2. Ve a: http://localhost:3000/code-modifier
3. Prueba con un prompt como:
   ```
   Agrega un comentario al inicio de page.tsx que diga "Modified with Groq AI"
   ```

## Ventajas de Groq

✅ **Gratis** - Sin costo, sin límites estrictos
✅ **Rápido** - LPU Inference es súper rápido (10-100x más rápido que GPUs)
✅ **Potente** - Llama 3.1 70B es excelente para código
✅ **Sin configuración de facturación** - Solo regístrate y usa

## Modelos disponibles en Groq

- `llama-3.1-70b-versatile` (predeterminado) - Mejor para código
- `llama-3.1-8b-instant` - Más rápido, menos preciso
- `mixtral-8x7b-32768` - Buen balance

## Troubleshooting

### Error: "GROQ_API_KEY not found"
- Verifica que agregaste la variable en `.env.local`
- Asegúrate de que no haya espacios extras
- Reinicia el servidor: detén y ejecuta `npm run dev` de nuevo

### Error de API
- Verifica tu API key en https://console.groq.com/keys
- Asegúrate de copiar la key completa (empieza con `gsk_`)
