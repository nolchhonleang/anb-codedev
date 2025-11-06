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
    const { sourceCode, analysisTypes, severityFilter, userId } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const analysisPrompts = {
      bugs: "Identify potential bugs, logic errors, null pointer exceptions, array bounds issues, and other runtime errors.",
      performance: "Analyze performance bottlenecks, inefficient algorithms, memory leaks, and optimization opportunities.",
      refactor: "Suggest code refactoring improvements for better readability, maintainability, and structure.",
      'best-practices': "Check adherence to coding standards, design patterns, and industry best practices."
    }

    const selectedAnalyses = analysisTypes.map(type => analysisPrompts[type]).join('\n')

    const prompt = `Perform a comprehensive code analysis focusing on: ${analysisTypes.join(', ')}

Code to analyze:
\`\`\`
${sourceCode}
\`\`\`

Please provide:
${selectedAnalyses}

For each issue found:
1. Severity level (Critical, High, Medium, Low)
2. Specific location in code
3. Clear description of the problem
4. Suggested fix with code example
5. Explanation of why this is important

Filter results to show ${severityFilter} severity issues.

Format the response with clear sections and actionable recommendations.`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 6144,
        }
      })
    })

    const geminiData = await geminiResponse.json()
    const analysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!analysis) {
      throw new Error('No analysis generated')
    }

    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('code_executions').insert({
        user_id: userId,
        language: `debug-${analysisTypes.join('-')}`,
        code: sourceCode,
        output: analysis
      })
    }

    return new Response(
      JSON.stringify({
        analysis,
        analysisTypes,
        severityFilter,
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
