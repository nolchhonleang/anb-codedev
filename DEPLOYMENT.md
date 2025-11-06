# A&B CodeDev Deployment Guide

## 🚀 Supabase Edge Functions Setup

### Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Docker installed (for local development)
3. Supabase project created

### 1. Initialize Supabase
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref iwvgfehzqtwumvpobrsy

# Pull remote schema
supabase db pull
```

### 2. Deploy Edge Functions
```bash
# Deploy the code converter function
supabase functions deploy code-converter

# Deploy other functions (when created)
supabase functions deploy ai-chat
supabase functions deploy run-code
supabase functions deploy debug-refactor
supabase functions deploy code-explainer
supabase functions deploy doc-generator
supabase functions deploy code-optimizer
supabase functions deploy test-generator
supabase functions deploy security-audit
```

### 3. Set Environment Variables
In your Supabase dashboard, go to Settings > Edge Functions and add:

```bash
# Google Gemini API Key (required for AI functionality)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase credentials (automatically available)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup
Run the SQL script in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create code_executions table
CREATE TABLE IF NOT EXISTS code_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  output TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own code executions" ON code_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own code executions" ON code_executions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 🔑 Google Gemini API Setup

### 1. Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 2. Add to Supabase
1. Go to your Supabase project dashboard
2. Settings > Edge Functions
3. Add secret: `GEMINI_API_KEY` = your_api_key

## 🌐 Frontend Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

## 📋 Environment Variables (.env)
```env
VITE_SUPABASE_URL=https://iwvgfehzqtwumvpobrsy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=iwvgfehzqtwumvpobrsy
```

## 🧪 Testing Edge Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test the code converter
curl -X POST 'http://localhost:54321/functions/v1/code-converter' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "print(\"Hello World\")",
    "fromLanguage": "python",
    "toLanguage": "javascript",
    "preserveComments": true,
    "preserveFormatting": true
  }'
```

## 🚀 Production Checklist

- [ ] Database tables created
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] Google Gemini API key configured
- [ ] Frontend deployed
- [ ] DNS configured (if custom domain)
- [ ] SSL certificate active
- [ ] Error monitoring setup (optional)

## 📊 Monitoring & Analytics

### Supabase Dashboard
- Monitor function invocations
- Check database usage
- Review authentication metrics

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for user session replay
- Google Analytics for usage metrics

## 🔄 CI/CD Pipeline (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🎯 Next Steps

1. **Deploy the code-converter function**
2. **Set up Google Gemini API key**
3. **Test the code conversion feature**
4. **Create additional Edge Functions for other PRD features**
5. **Deploy to production**

Your A&B CodeDev application is now ready for deployment with full AI-powered code conversion capabilities!
