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
    const { sourceCode, vulnerabilityTypes, userId } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const vulnerabilityChecks = {
      'sql-injection': 'SQL injection vulnerabilities in database queries',
      'xss': 'Cross-site scripting (XSS) vulnerabilities in user input handling',
      'csrf': 'Cross-site request forgery (CSRF) vulnerabilities',
      'auth': 'Authentication and authorization issues',
      'input-validation': 'Input validation and sanitization problems',
      'sensitive-data': 'Sensitive data exposure and handling issues'
    }

    const selectedChecks = vulnerabilityTypes.map(type => vulnerabilityChecks[type]).join(', ')

    const prompt = `Perform a comprehensive security audit on this code, focusing on: ${selectedChecks}

\`\`\`
${sourceCode}
\`\`\`

Please analyze for:
${vulnerabilityTypes.map(type => `- ${vulnerabilityChecks[type]}`).join('\n')}

For each vulnerability found:
1. **Severity**: Critical, High, Medium, Low
2. **Type**: Specific vulnerability category
3. **Location**: Where in the code the issue exists
4. **Description**: Clear explanation of the security risk
5. **Impact**: Potential consequences if exploited
6. **Fix**: Specific code changes to resolve the issue
7. **Prevention**: Best practices to prevent similar issues

Also provide:
- Overall security score (1-10)
- Risk assessment summary
- Prioritized remediation plan
- Security best practices recommendations

Format the response as a professional security audit report.`

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 6144,
        }
      })
    })

    const geminiData = await geminiResponse.json()
    const auditReport = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!auditReport) {
      throw new Error('No security audit generated')
    }

    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('code_executions').insert({
        user_id: userId,
        language: `security-${vulnerabilityTypes.join('-')}`,
        code: sourceCode,
        output: auditReport
      })
    }

    return new Response(
      JSON.stringify({
        auditReport,
        vulnerabilityTypes,
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
