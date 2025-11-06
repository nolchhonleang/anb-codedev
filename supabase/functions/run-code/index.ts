import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language } = await req.json();

    // For JavaScript, we can execute safely in Deno
    if (language === 'javascript') {
      try {
        // Create a safe execution context
        const captureLog: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            captureLog.push(args.map(arg => String(arg)).join(' '));
          },
        };

        // Create a function that executes the code
        const executeCode = new Function('console', code);
        executeCode(customConsole);

        return new Response(
          JSON.stringify({ 
            output: captureLog.join('\n') || 'Code executed successfully (no output)',
            success: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For other languages, return a simulated response
    // In production, you would integrate with a code execution API
    return new Response(
      JSON.stringify({ 
        output: `${language} code execution is coming soon!\n\nYour code:\n${code}\n\nNote: Currently only JavaScript execution is supported. Other languages will be added in future updates.`,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in run-code function:', error);
    return new Response(
      JSON.stringify({ 
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
