'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateExerciseDetails(exerciseName: string) {
    if (!process.env.OPENAI_API_KEY) {
        return { error: 'OpenAI API Key not configured' };
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert fitness coach. Given an exercise name, you must provide its details in JSON format.
                    The JSON must match this structure exactly:
                    {
                        "category": "Weightlifting" | "Gymnastics" | "Monostructural" | "Functional Bodybuilding",
                        "subcategory": string (optional, generic type like "Squat", "Press", "Pull"),
                        "equipment": string[] (e.g. ["Barbell"], ["Dumbbell"], ["Kettlebell"], ["None"]),
                        "modality_suitability": string[] (e.g. ["Strength", "Hypertrophy", "Metcon", "Warmup"]),
                        "description": string (short technical description in Spanish)
                    }
                    
                    Respond ONLY with the valid JSON.`
                },
                { role: "user", content: `Exercise: ${exerciseName}` }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const data = JSON.parse(content);
        return { data };

    } catch (error: any) {
        console.error("OpenAI Error:", error);
        return { error: "Failed to generate exercise details." };
    }
}
