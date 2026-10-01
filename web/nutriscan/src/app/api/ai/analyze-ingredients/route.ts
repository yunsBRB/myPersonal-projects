import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { ingredients, product_name } = await request.json();

        if (!ingredients) {
            return NextResponse.json({ error: 'Ingredients required' }, { status: 400 });
        }

        // Call OpenAI API for analysis
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Analyze these food ingredients: ${ingredients}. Product: ${product_name || 'unknown'}.
            Identify: 1) Each additive (E-codes) with risk level (safe/moderate/risky/banned)
            2) NOVA group (1-4) estimation 3) Diet compatibility (vegan/vegetarian/halal/kosher/gluten_free/lactose_free/keto)
            4) Top 3 health concerns with severity (low/medium/high)
            Return ONLY JSON: {"additives":[{"code":"","name":"","risk_level":"","description":""}], "nova_group":1, "diet_compatibility":{"vegan":true,"halal":false}, "health_concerns":[{"concern":"","severity":""}]}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!openAIResponse.ok) {
            throw new Error(`OpenAI Error: ${openAIResponse.statusText}`);
        }

        const aiData = await openAIResponse.json();
        const analysisResult = JSON.parse(aiData.choices[0].message.content);

        return NextResponse.json({ success: true, analysis: analysisResult });

    } catch (error) {
        console.error('API /ai/analyze-ingredients error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
