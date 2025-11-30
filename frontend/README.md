<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1juvg2YwG7On-flNMfhrqTBDaTKjXcYe0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Styling

Tailwind CSS powers all utility classes. The setup lives in `tailwind.config.ts`, `postcss.config.js`, and `index.css`. To customize the design system:

1. Update `tailwind.config.ts` to extend colors, fonts, or shadows.
2. Add any additional base styles in `index.css` beneath the `@tailwind` directives.
3. Run `npm run dev` (or `npm run build`) so Vite rebuilds with the updated Tailwind output.
