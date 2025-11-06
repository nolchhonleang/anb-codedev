import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sourceCode, explanationLevel, explanationType, userId } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Create detailed prompt based on explanation level and type
    const levelPrompts = {
      beginner: "Explain this code in simple terms that a programming beginner can understand. Use everyday analogies and avoid technical jargon.",
      intermediate: "Provide a detailed explanation suitable for someone with basic programming knowledge. Include technical concepts but explain them clearly.",
      expert: "Give a comprehensive technical analysis including design patterns, performance implications, and architectural considerations."
    }

    const typePrompts = {
      overview: "Provide a high-level overview of what this code does and its main purpose.",
      'line-by-line': "Go through the code line by line, explaining what each part does and why.",
      concepts: "Focus on the programming concepts, algorithms, and patterns used in this code.",
      optimization: "Analyze the code for potential optimizations, performance improvements, and best practices.",
      debugging: "Identify potential bugs, edge cases, and areas that might cause issues."
    }

    const prompt = `${levelPrompts[explanationLevel]} ${typePrompts[explanationType]}

Code to explain:
\`\`\`
${sourceCode}
\`\`\`

Please provide:
1. Clear explanation appropriate for ${explanationLevel} level
2. Focus on ${explanationType} analysis
3. Use proper formatting with headers and bullet points
4. Include examples where helpful
5. Highlight important concepts or potential issues`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    })

    const geminiData = await geminiResponse.json()
    const explanation = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!explanation) {
      throw new Error('No explanation generated')
    }

    // Save to database
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('code_executions').insert({
        user_id: userId,
        language: `explain-${explanationLevel}`,
        code: sourceCode,
        output: explanation
      })
    }

    return new Response(
      JSON.stringify({
        explanation,
        explanationLevel,
        explanationType,
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
