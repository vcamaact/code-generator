import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, title } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // TODO: Initialize Orchestrator and run workflow
    // const result = await orchestrator.run({ prompt, title });

    return NextResponse.json({ 
      message: 'Request received', 
      data: { prompt, title },
      status: 'processing'
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
