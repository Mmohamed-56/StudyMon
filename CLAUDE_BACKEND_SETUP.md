# 🤖 Claude API Backend Setup

## 📋 What I Created

### **1. Netlify Function** 
- `netlify/functions/generate-questions.js` - Backend API that calls Claude
- Avoids CORS by running server-side
- Secure (API key stays on server)

### **2. Netlify Config**
- `netlify.toml` - Deployment configuration
- Sets up functions directory
- Handles routing

### **3. Updated Frontend**
- `src/utils/aiService.js` - Now calls backend function
- Uses mocks in development (localhost)
- Uses Claude in production (deployed site)

---

## 🚀 How to Deploy

### **Option 1: Deploy to Netlify (Recommended)**

1. **Create Netlify account** (free)
   - Go to https://netlify.com
   - Sign up with GitHub

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Add StudyMon app"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

3. **Connect to Netlify**
   - Click "Add new site" → "Import from Git"
   - Select your repo
   - Build settings (auto-detected):
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

4. **Add Environment Variables**
   - Site settings → Environment variables
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
     - `ANTHROPIC_API_KEY` = your Claude API key (sk-ant-...)
   - Redeploy site

5. **Done!** Claude API will work on your live site!

---

### **Option 2: Deploy to Vercel**

Similar process:
1. Go to vercel.com
2. Import from GitHub
3. Add environment variables
4. Deploy

Note: You'd need to convert Netlify function to Vercel format (I can help with that)

---

## 🧪 Testing Locally (Optional)

To test Netlify functions locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run dev server with functions
netlify dev
```

This runs your app AND the backend functions locally!

---

## 📱 Current Behavior

### **Development (localhost:5173):**
- Uses mock questions ✅
- No backend needed ✅
- Works immediately ✅

### **Production (your-site.netlify.app):**
- Calls backend function ✅
- Backend calls Claude API ✅
- Unlimited AI questions ✅

---

## 🎯 Next Steps

**For Now:**
- ✅ Keep using mock questions
- ✅ Build remaining features
- ✅ Test everything locally

**When Ready to Deploy:**
1. Push to GitHub
2. Deploy to Netlify
3. Add environment variables
4. Claude API works automatically!

---

## 💡 About PixiJS

**PixiJS** is great for:
- ✅ Sprite animations
- ✅ Particle effects
- ✅ Smooth transitions
- ✅ Game-like performance

**But:**
- ❌ Big learning curve
- ❌ Harder to style with Tailwind
- ❌ More complex setup
- ❌ Your current CSS approach already looks great!

**My Recommendation:**
- Keep current CSS approach (it's working beautifully!)
- Use PixiJS ONLY if you want:
  - Animated battle scenes
  - Particle effects when using skills
  - Smooth creature movement

For a study app, your current approach is perfect! 🎨

---

**Want to stick with mocks for now and deploy later?** Or want help setting up GitHub + Netlify right now? 🚀

