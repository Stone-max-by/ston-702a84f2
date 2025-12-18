import { ApiProvider } from "@/types/api";

export const apiProviders: ApiProvider[] = [
  {
    id: "image-api",
    name: "Image Creation API",
    description: "Generate, edit, and transform images using AI",
    baseUrl: "https://api.imageforge.ai/v1",
    icon: "🖼️",
    color: "from-purple-500/20 to-pink-500/20",
    totalEndpoints: 4,
    totalRequests: 125840,
    successRate: 99.2,
    avgResponseTime: 320,
    endpoints: [
      {
        id: "img-1",
        method: "POST",
        path: "/generate",
        title: "Generate Image",
        description: "Generate an image from a text prompt using AI models.",
        requiresAuth: true,
        rateLimit: "20 req/min",
        params: [
          { name: "prompt", type: "string", required: true, description: "Text description of the image" },
          { name: "size", type: "string", required: false, description: "Image size (256x256, 512x512, 1024x1024)" },
          { name: "model", type: "string", required: false, description: "Model to use (dall-e-3, stable-diffusion)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "imageUrl": "https://cdn.imageforge.ai/generated/abc123.png",
    "promptUsed": "A sunset over mountains",
    "model": "dall-e-3"
  }
}`,
      },
      {
        id: "img-2",
        method: "POST",
        path: "/edit",
        title: "Edit Image",
        description: "Edit an existing image with AI-powered modifications.",
        requiresAuth: true,
        rateLimit: "15 req/min",
        params: [
          { name: "imageUrl", type: "string", required: true, description: "URL of the image to edit" },
          { name: "prompt", type: "string", required: true, description: "Edit instructions" },
          { name: "mask", type: "string", required: false, description: "Mask image URL for inpainting" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "editedImageUrl": "https://cdn.imageforge.ai/edited/xyz789.png"
  }
}`,
      },
      {
        id: "img-3",
        method: "POST",
        path: "/upscale",
        title: "Upscale Image",
        description: "Upscale an image to higher resolution using AI.",
        requiresAuth: true,
        rateLimit: "10 req/min",
        params: [
          { name: "imageUrl", type: "string", required: true, description: "URL of the image to upscale" },
          { name: "scale", type: "number", required: false, description: "Scale factor (2, 4, 8)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "upscaledUrl": "https://cdn.imageforge.ai/upscaled/img.png",
    "originalSize": "512x512",
    "newSize": "2048x2048"
  }
}`,
      },
      {
        id: "img-4",
        method: "POST",
        path: "/remove-bg",
        title: "Remove Background",
        description: "Remove background from an image automatically.",
        requiresAuth: true,
        rateLimit: "30 req/min",
        params: [
          { name: "imageUrl", type: "string", required: true, description: "URL of the image" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "transparentUrl": "https://cdn.imageforge.ai/nobg/img.png"
  }
}`,
      },
    ],
  },
  {
    id: "download-api",
    name: "Download Tools API",
    description: "Download videos, audio, and files from various platforms",
    baseUrl: "https://api.dltools.io/v2",
    icon: "⬇️",
    color: "from-blue-500/20 to-cyan-500/20",
    totalEndpoints: 5,
    totalRequests: 892450,
    successRate: 97.8,
    avgResponseTime: 450,
    endpoints: [
      {
        id: "dl-1",
        method: "POST",
        path: "/youtube",
        title: "YouTube Download",
        description: "Download videos or audio from YouTube.",
        requiresAuth: true,
        rateLimit: "10 req/min",
        params: [
          { name: "url", type: "string", required: true, description: "YouTube video URL" },
          { name: "format", type: "string", required: false, description: "Format (mp4, mp3, webm)" },
          { name: "quality", type: "string", required: false, description: "Quality (360p, 720p, 1080p, 4k)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.dltools.io/yt/video.mp4",
    "title": "Video Title",
    "duration": "10:30",
    "expiresIn": 3600
  }
}`,
      },
      {
        id: "dl-2",
        method: "POST",
        path: "/instagram",
        title: "Instagram Download",
        description: "Download posts, reels, and stories from Instagram.",
        requiresAuth: true,
        rateLimit: "15 req/min",
        params: [
          { name: "url", type: "string", required: true, description: "Instagram post/reel URL" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "media": [
      { "type": "video", "url": "https://..." },
      { "type": "image", "url": "https://..." }
    ]
  }
}`,
      },
      {
        id: "dl-3",
        method: "POST",
        path: "/tiktok",
        title: "TikTok Download",
        description: "Download TikTok videos without watermark.",
        requiresAuth: true,
        rateLimit: "20 req/min",
        params: [
          { name: "url", type: "string", required: true, description: "TikTok video URL" },
          { name: "watermark", type: "boolean", required: false, description: "Include watermark (default: false)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "videoUrl": "https://cdn.dltools.io/tt/video.mp4",
    "audioUrl": "https://cdn.dltools.io/tt/audio.mp3",
    "author": "@username"
  }
}`,
      },
      {
        id: "dl-4",
        method: "POST",
        path: "/twitter",
        title: "Twitter/X Download",
        description: "Download videos and GIFs from Twitter/X.",
        requiresAuth: true,
        rateLimit: "20 req/min",
        params: [
          { name: "url", type: "string", required: true, description: "Tweet URL" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "media": [
      { "quality": "720p", "url": "https://..." }
    ]
  }
}`,
      },
      {
        id: "dl-5",
        method: "POST",
        path: "/spotify",
        title: "Spotify Download",
        description: "Download tracks and playlists from Spotify.",
        requiresAuth: true,
        rateLimit: "5 req/min",
        params: [
          { name: "url", type: "string", required: true, description: "Spotify track/playlist URL" },
          { name: "format", type: "string", required: false, description: "Format (mp3, flac)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "tracks": [
      { "title": "Song Name", "artist": "Artist", "downloadUrl": "https://..." }
    ]
  }
}`,
      },
    ],
  },
  {
    id: "text-api",
    name: "Text & AI API",
    description: "Text generation, translation, and AI chat capabilities",
    baseUrl: "https://api.textgenius.io/v1",
    icon: "💬",
    color: "from-green-500/20 to-emerald-500/20",
    totalEndpoints: 4,
    totalRequests: 2156780,
    successRate: 99.8,
    avgResponseTime: 180,
    endpoints: [
      {
        id: "txt-1",
        method: "POST",
        path: "/chat",
        title: "AI Chat",
        description: "Chat with AI models like GPT-4, Claude, etc.",
        requiresAuth: true,
        rateLimit: "30 req/min",
        params: [
          { name: "messages", type: "array", required: true, description: "Array of chat messages" },
          { name: "model", type: "string", required: false, description: "Model (gpt-4, claude-3, gemini)" },
          { name: "temperature", type: "number", required: false, description: "Response randomness (0-1)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "response": "Hello! How can I help you?",
    "model": "gpt-4",
    "tokensUsed": 150
  }
}`,
      },
      {
        id: "txt-2",
        method: "POST",
        path: "/translate",
        title: "Translate Text",
        description: "Translate text between 100+ languages.",
        requiresAuth: true,
        rateLimit: "50 req/min",
        params: [
          { name: "text", type: "string", required: true, description: "Text to translate" },
          { name: "from", type: "string", required: false, description: "Source language (auto-detect if empty)" },
          { name: "to", type: "string", required: true, description: "Target language code" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "translatedText": "Bonjour le monde",
    "detectedLanguage": "en",
    "confidence": 0.98
  }
}`,
      },
      {
        id: "txt-3",
        method: "POST",
        path: "/summarize",
        title: "Summarize Text",
        description: "Summarize long text or articles.",
        requiresAuth: true,
        rateLimit: "20 req/min",
        params: [
          { name: "text", type: "string", required: true, description: "Text to summarize" },
          { name: "maxLength", type: "number", required: false, description: "Max summary length in words" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "summary": "Brief summary of the text...",
    "originalLength": 5000,
    "summaryLength": 150
  }
}`,
      },
      {
        id: "txt-4",
        method: "POST",
        path: "/generate",
        title: "Generate Content",
        description: "Generate content like articles, emails, code.",
        requiresAuth: true,
        rateLimit: "15 req/min",
        params: [
          { name: "type", type: "string", required: true, description: "Content type (article, email, code)" },
          { name: "prompt", type: "string", required: true, description: "Content instructions" },
          { name: "tone", type: "string", required: false, description: "Writing tone (formal, casual)" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "content": "Generated content here...",
    "wordCount": 500
  }
}`,
      },
    ],
  },
  {
    id: "game-api",
    name: "Game Archive API",
    description: "Access game database, downloads, and metadata",
    baseUrl: "https://api.pcgamesarchive.com/v1",
    icon: "🎮",
    color: "from-orange-500/20 to-red-500/20",
    totalEndpoints: 5,
    totalRequests: 458920,
    successRate: 98.5,
    avgResponseTime: 220,
    endpoints: [
      {
        id: "game-1",
        method: "GET",
        path: "/products",
        title: "List All Products",
        description: "Retrieve a paginated list of all available products.",
        requiresAuth: false,
        rateLimit: "100 req/min",
        params: [
          { name: "page", type: "number", required: false, description: "Page number" },
          { name: "limit", type: "number", required: false, description: "Items per page (max 100)" },
          { name: "category", type: "string", required: false, description: "Filter by category" },
        ],
        responseExample: `{
  "success": true,
  "data": [
    { "id": "abc123", "title": "Cyberpunk 2077", "size": "70.5 GB" }
  ],
  "pagination": { "page": 1, "total": 156 }
}`,
      },
      {
        id: "game-2",
        method: "GET",
        path: "/products/:id",
        title: "Get Product Details",
        description: "Retrieve detailed information about a specific product.",
        requiresAuth: false,
        rateLimit: "100 req/min",
        params: [
          { name: "id", type: "string", required: true, description: "Product ID" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "Cyberpunk 2077",
    "size": "70.5 GB",
    "files": [...]
  }
}`,
      },
      {
        id: "game-3",
        method: "GET",
        path: "/download/:fileId",
        title: "Generate Download Link",
        description: "Generate a signed download URL. Valid for 1 hour.",
        requiresAuth: true,
        rateLimit: "10 req/min",
        params: [
          { name: "fileId", type: "string", required: true, description: "File ID" },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/signed...",
    "expiresIn": 3600
  }
}`,
      },
      {
        id: "game-4",
        method: "GET",
        path: "/trending",
        title: "Trending Products",
        description: "Get current trending products.",
        requiresAuth: false,
        rateLimit: "60 req/min",
        params: [],
        responseExample: `{
  "success": true,
  "data": [
    { "id": "abc", "title": "...", "trend": "+24%" }
  ]
}`,
      },
      {
        id: "game-5",
        method: "GET",
        path: "/search",
        title: "Advanced Search",
        description: "Full-text search with filters.",
        requiresAuth: false,
        rateLimit: "50 req/min",
        params: [
          { name: "q", type: "string", required: true, description: "Search query" },
          { name: "filters", type: "object", required: false, description: "Filter object" },
        ],
        responseExample: `{
  "success": true,
  "data": [...],
  "facets": { "categories": [...] }
}`,
      },
    ],
  },
];
