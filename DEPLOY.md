# 🚀 Quick Deploy Reference Card

## Pre-Deploy Commands

```bash
# 1. Build locally first
npm run build

# 2. Test the build
npm run start
# Open: http://localhost:3000

# 3. Analyze bundle (optional)
npm run build:analyze
```

## Deploy to Vercel

```bash
# Install Vercel CLI (first time only)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview (test first!)
vercel

# Deploy to production (when ready)
vercel --prod
```

## Post-Deploy Checklist

- [ ] Test all pages on production URL
- [ ] Run Lighthouse on production URL (Chrome DevTools)
- [ ] Check Vercel Analytics dashboard
- [ ] Test Firebase integration (auth, database, storage)
- [ ] Test payment gateway (Razorpay)
- [ ] Test Google Places autocomplete
- [ ] Test AI chatbot (Gemini)
- [ ] Verify all images load correctly
- [ ] Test on mobile device
- [ ] Submit sitemap to Google Search Console

## Environment Variables (Add in Vercel)

Essential:
- `NEXT_PUBLIC_SITE_URL` - Your production domain
- `GOOGLE_PLACES_API_KEY`
- `NEXT_PUBLIC_ADMIN_PASS`
- Firebase credentials (8 variables)
- Razorpay credentials (2 variables)
- `GEMINI_API_KEY`

## Target Performance

After optimizations:
- Performance: **90-95** (was 82)
- Accessibility: **98-100** (was 96)
- Best Practices: **100** (maintained)
- SEO: **100** (was 92)

## Bundle Size Reduction

- JavaScript: **-910 KiB** (-19%)
- CSS: **-7 KiB**
- Images: **-17-50 KiB**
- **Total: ~1 MB reduction**

## Support

- Lighthouse Report: `docs/LIGHTHOUSE_OPTIMIZATION_OCT23_2025.md`
- Deployment Guide: `docs/VERCEL_DEPLOYMENT_GUIDE.md`
- Full Summary: `docs/OPTIMIZATION_COMPLETE_SUMMARY.md`

---

**Ready?** Run: `vercel --prod` 🚀
