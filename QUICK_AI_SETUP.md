# 🚀 Quick AI Setup - Get Real AI Answers!

## 🔍 Why You're Getting Templates Instead of AI Answers

Even though you're logged in, the AI tools show templates because:
- ❌ **GEMINI_API_KEY not configured** in Supabase
- ❌ **Edge Functions not deployed** with AI functionality
- ✅ **Authentication works** - you can log in
- ✅ **Frontend works** - tools load and show templates

## 🎯 Two Solutions to Get Real AI

### 🚀 **Option 1: Quick Web Setup (Recommended)**

1. **Get Gemini API Key**:
   - Go to: https://aistudio.google.com/
   - Sign in → Create API Key
   - Copy the key (starts with `AIza...`)

2. **Configure in Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/iwvgfehzqtwumvpobrsy
   - Go to **Settings** → **Edge Functions** → **Secrets**
   - Add new secret: `GEMINI_API_KEY` = `your_api_key_here`

3. **Deploy Functions via Web**:
   - In Supabase Dashboard → **Edge Functions**
   - Create new function for each AI tool
   - Copy the code from your local `supabase/functions/` folders

### 🛠️ **Option 2: Local CLI Setup**

1. **Install Supabase CLI** (Windows):
   ```powershell
   # Using Chocolatey
   choco install supabase
   
   # OR using Scoop
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

2. **Configure and Deploy**:
   ```bash
   supabase login
   supabase link --project-ref iwvgfehzqtwumvpobrsy
   supabase secrets set GEMINI_API_KEY=your_api_key_here
   supabase functions deploy code-generator
   supabase functions deploy doc-generator
   # ... deploy all functions
   ```

## 🧪 **Test After Setup**

Once configured, try:
1. **Code Generation**: Ask for "Create a calculator function"
2. **Documentation**: Paste any code and generate docs
3. **Code Explanation**: Get detailed explanations

**Expected Result**: Real AI-generated content instead of templates!

## 🔧 **Troubleshooting**

### Still seeing templates?
- Check Supabase secrets are set correctly
- Verify Edge Functions are deployed
- Check browser console for API errors

### API quota exceeded?
- Gemini free tier: 15 requests/minute, 1,500/day
- Upgrade to paid plan for higher limits

## 🎉 **Success Indicators**

You'll know it's working when you see:
- ✅ "AI-powered documentation generated successfully!"
- ✅ Real, contextual code instead of generic templates
- ✅ Detailed, specific answers to your requests

---

**The key issue**: Your app works perfectly, but needs the GEMINI_API_KEY configured in Supabase to activate real AI instead of templates! 🚀
