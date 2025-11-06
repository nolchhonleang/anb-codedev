import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, fromLanguage, toLanguage, preserveComments = true, preserveFormatting = true } = await req.json()

    // Validate input
    if (!code || !fromLanguage || !toLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: code, fromLanguage, toLanguage' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'GROQ_API_KEY is not configured. Please set up your Groq API key in the Supabase dashboard.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the prompt for Groq
    const systemPrompt = `You are an expert code converter. Convert the following ${fromLanguage} code to ${toLanguage}.

Requirements:
- ${preserveComments ? 'Preserve all comments and translate them if needed' : 'Remove comments'}
- ${preserveFormatting ? 'Maintain similar code structure and formatting' : 'Optimize code structure'}
- Ensure the converted code is syntactically correct and follows best practices
- Maintain the same functionality and logic
- Only return the raw converted code without any explanations or markdown formatting`

    const userPrompt = `Convert this ${fromLanguage} code to ${toLanguage}:
\`\`\`${fromLanguage}
${code}
\`\`\``

    // Make request to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 8000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Groq API error:', error)
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const convertedCode = data.choices[0]?.message?.content?.trim() || code

    return new Response(
      JSON.stringify({
        convertedCode,
        isPlaceholder: false,
        message: 'Code converted successfully'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in code conversion:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to convert code',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
