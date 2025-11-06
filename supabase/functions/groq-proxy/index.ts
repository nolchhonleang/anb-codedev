import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Default GROQ API URL
const DEFAULT_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Read secret and optional custom URL from environment
    const groqKey = Deno.env.get('GROQ_API_KEY')
    const groqUrl = Deno.env.get('GROQ_API_URL') ?? DEFAULT_GROQ_URL

    if (!groqKey) {
      console.error('GROQ_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Forward request to Groq API
    const resp = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify(body),
    })

    const text = await resp.text()

    if (!resp.ok) {
      console.error('Groq returned error:', resp.status, text)
      // Try to return parsed JSON if possible
      try {
        const parsed = JSON.parse(text)
        return new Response(JSON.stringify(parsed), {
          status: resp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (_e) {
        return new Response(JSON.stringify({ error: text }), {
          status: resp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // If OK, return the raw parsed JSON from Groq
    try {
      const parsed = JSON.parse(text)
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (e) {
      // Not JSON? return as text
      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      })
    }
  } catch (error) {
    console.error('Error in groq-proxy function:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
