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
    const { sourceCode, framework, testTypes, coverage, userId } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const testTypeDescriptions = {
      unit: "Unit tests for individual functions and methods",
      integration: "Integration tests for component interactions",
      edge: "Edge case tests for boundary conditions and error scenarios"
    }

    const selectedTests = testTypes.map(type => testTypeDescriptions[type]).join(', ')

    const prompt = `Generate comprehensive ${framework} tests for this code:

\`\`\`
${sourceCode}
\`\`\`

Requirements:
- Test framework: ${framework}
- Test types: ${selectedTests}
- Coverage level: ${coverage}
- Include setup and teardown if needed
- Add mock data and fixtures
- Test both success and failure scenarios
- Include edge cases and boundary conditions
- Add descriptive test names and comments

Generate:
1. Complete test suite with proper imports
2. Test data and mocks
3. Setup/teardown functions
4. Comprehensive test cases covering all scenarios
5. Proper assertions and expectations

Make the tests production-ready and maintainable.`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 6144,
        }
      })
    })

    const geminiData = await geminiResponse.json()
    const generatedTests = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedTests) {
      throw new Error('No tests generated')
    }

    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('code_executions').insert({
        user_id: userId,
        language: `test-${framework}`,
        code: sourceCode,
        output: generatedTests
      })
    }

    return new Response(
      JSON.stringify({
        generatedTests,
        framework,
        testTypes,
        coverage,
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
