import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere un prompt' },
        { status: 400 }
      );
    }

    // Usando la API de completions de Codex
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente de programación experto. Genera solo el código solicitado, sin explicaciones adicionales. El código debe estar formateado para mostrarse en una página web.',
        },
        {
          role: 'user',
          content: `Genera código para: ${prompt}. Solo devuelve el código sin explicaciones.`,
        },
      ],
      temperature: 0.7,
    });

    const code = completion.choices[0]?.message?.content || 'No se pudo generar el código';

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error('Error detallado al generar código:', {
      message: error.message,
      status: error.status,
      code: error.code,
      response: error.response?.data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.status || 500 }
    );
  }
}
