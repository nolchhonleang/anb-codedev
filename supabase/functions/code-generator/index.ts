import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fallback code generator for when GEMINI_API_KEY is not set
function generateFallbackCode(description: string, language: string): string {
  const desc = description.toLowerCase()
  
  // HTML/Web page detection
  if ((language === 'html' || desc.includes('web page') || desc.includes('webpage')) && 
      (desc.includes('hello') || desc.includes('hello world'))) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            font-size: 3rem;
            margin: 0;
            animation: fadeIn 1s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World! 👋</h1>
        <p>Welcome to your first web page!</p>
    </div>
</body>
</html>`
  }
  
  // JavaScript examples
  if (language === 'javascript' || language === 'typescript') {
    if (desc.includes('function') || desc.includes('hello')) {
      return `// Hello World Function
function sayHello(name = 'World') {
    return \`Hello, \${name}!\`;
}

// Example usage
console.log(sayHello());
console.log(sayHello('Developer'));

// Export for use in other modules
export { sayHello };`
    }
  }
  
  // Python examples
  if (language === 'python') {
    if (desc.includes('hello') || desc.includes('function')) {
      return `def say_hello(name="World"):
    """
    A simple function that returns a greeting message.
    
    Args:
        name (str): The name to greet. Defaults to "World".
    
    Returns:
        str: A greeting message.
    """
    return f"Hello, {name}!"

# Example usage
if __name__ == "__main__":
    print(say_hello())
    print(say_hello("Developer"))`
    }
  }
  
  // Generic fallback
  return `// ${description}
// Generated code for ${language}
// 
// Note: This is a basic template. For AI-powered code generation,
// please configure GEMINI_API_KEY in your Supabase secrets.

// TODO: Implement your code here based on the description above`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { description, language, codeType, complexity, requirements, userId } = await req.json()

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
    // If no API key, use fallback generator
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY not configured, using fallback generator')
      const fallbackCode = generateFallbackCode(description, language)
      return new Response(
        JSON.stringify({
          generatedCode: fallbackCode,
          model: 'fallback-generator',
          timestamp: new Date().toISOString(),
          warning: 'Using fallback generator. Set GEMINI_API_KEY for AI-powered generation.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Create prompt for Gemini
    const prompt = `You are an expert ${language} developer. Generate production-ready code based on this description:

${description}

${requirements ? `Additional requirements: ${requirements}` : ''}

Please provide:
1. Complete, working, production-ready code
2. Proper error handling and validation
3. Clear comments explaining key parts
4. Best practices for ${language}
5. Clean, readable, and maintainable code

IMPORTANT: Return ONLY the code itself, without any markdown code blocks, explanations, or additional text. Just the raw, executable code.`

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
    }

    const geminiData = await geminiResponse.json()
    let generatedCode = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedCode) {
      throw new Error('No code generated from Gemini API')
    }

    // Clean up markdown code blocks if present
    generatedCode = generatedCode
      .replace(/^```[\w]*\n/gm, '')  // Remove opening code blocks
      .replace(/\n```$/gm, '')        // Remove closing code blocks
      .trim()

    // Save to database if user is provided
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('code_executions').insert({
        user_id: userId,
        language: `generate-${language}`,
        code: description,
        output: generatedCode
      })
    }

    return new Response(
      JSON.stringify({
        generatedCode,
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
        tokens: geminiData.candidates?.[0]?.tokenCount || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Code generation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
