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
    const { sourceCode, optimizationType, complexityLevel, userId } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = `Optimize this code for ${optimizationType} with ${complexityLevel} level improvements:

\`\`\`
${sourceCode}
\`\`\`

Please provide:
1. **Optimized Code**: Improved version with better ${optimizationType}
2. **Analysis Report**: Detailed analysis including:
   - Current time/space complexity
   - Optimized time/space complexity
   - Performance improvements achieved
   - Memory usage optimizations
   - Bottlenecks identified and fixed
   - Before/after metrics comparison

Focus on:
- ${optimizationType === 'performance' ? 'Algorithm efficiency, loop optimization, caching strategies' : ''}
- ${optimizationType === 'memory' ? 'Memory allocation, data structure efficiency, garbage collection' : ''}
- ${optimizationType === 'complexity' ? 'Reducing time/space complexity, algorithm selection' : ''}
- ${optimizationType === 'readability' ? 'Code structure, naming conventions, documentation' : ''}

Provide both the optimized code and comprehensive analysis report.`

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
    const fullResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!fullResponse) {
      throw new Error('No optimization generated')
    }

    // Try to split the response into optimized code and analysis
    const sections = fullResponse.split(/(?:##?\s*(?:Analysis|Report|Optimized Code|Code))/i)
    const optimizedCode = sections.find(s => s.includes('```')) || fullResponse
    const analysisReport = sections.find(s => !s.includes('```') && s.length > 100) || 
      `# Optimization Analysis\n\nOptimization type: ${optimizationType}\nComplexity level: ${complexityLevel}\n\n${fullResponse}`

    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('code_executions').insert({
        user_id: userId,
        language: `optimize-${optimizationType}`,
        code: sourceCode,
        output: optimizedCode
      })
    }

    return new Response(
      JSON.stringify({
        optimizedCode: optimizedCode.trim(),
        analysisReport: analysisReport.trim(),
        optimizationType,
        complexityLevel,
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
