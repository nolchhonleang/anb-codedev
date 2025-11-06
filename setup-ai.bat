@echo off
echo 🚀 A&B CodeDev - AI Setup Script
echo ================================

echo.
echo 📋 This script will help you set up AI functionality
echo.

echo 1️⃣ First, get your Gemini API key:
echo    - Go to: https://aistudio.google.com/
echo    - Sign in and create an API key
echo    - Copy the key (starts with AIza...)
echo.

set /p GEMINI_KEY="🔑 Enter your Gemini API key: "

if "%GEMINI_KEY%"=="" (
    echo ❌ No API key provided. Exiting...
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up Supabase...

echo 📦 Installing Supabase CLI...
npm install -g supabase

echo 🔐 Logging into Supabase...
supabase login

echo 🔗 Linking project...
supabase link --project-ref iwvgfehzqtwumvpobrsy

echo 🔑 Setting Gemini API key...
supabase secrets set GEMINI_API_KEY=%GEMINI_KEY%

echo 🚀 Deploying Edge Functions...
supabase functions deploy code-converter
supabase functions deploy code-generator
supabase functions deploy code-explainer
supabase functions deploy debug-refactor
supabase functions deploy doc-generator
supabase functions deploy code-optimizer
supabase functions deploy test-generator
supabase functions deploy security-audit
supabase functions deploy run-code

echo.
echo ✅ Setup complete! 
echo.
echo 🧪 Test your AI tools:
echo    - Code Generation: http://localhost:8081/dashboard/generate
echo    - Documentation: http://localhost:8081/dashboard/docs
echo.
echo 🎉 Your A&B CodeDev now has full AI power!

pause
