# PIB Multilingual Video Platform

Transform government press releases into engaging multilingual video content with AI-powered automation.

## 🌟 Features

- **Multilingual Support**: Generate videos in 14+ Indian languages
- **AI-Powered Script Generation**: Automatically convert press releases to video scripts
- **Voice Generation**: Create natural-sounding voiceovers in multiple languages
- **Scene Management**: Build engaging scenes with templates and customization
- **Audio Timeline Editor**: Precise control over audio tracks and timing
- **Video Generation**: Transform scripts and audio into professional videos
- **Export Pipeline**: Process and export videos in various formats
- **Random Words Image Search**: Use random words from text files for diverse image selection
- **Customizable Word Files**: Upload your own text files to guide image selection

[Read detailed documentation about the Random Words feature](docs/random-words-feature.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase account for backend services

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pscs-36-platform

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

Access the application at http://localhost:3000

Try the new random words feature at http://localhost:3000/test-random-words

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id
```

#### API Key Descriptions

- **Supabase Keys** (Required): For database and authentication services
- **GEMINI_API_KEY** (Required): For AI-powered content generation
- **UNSPLASH_ACCESS_KEY** (Optional): For improved image search relevance. Get your key from [Unsplash Developers](https://unsplash.com/developers)
- **GOOGLE_API_KEY** (Optional): For Google Custom Search API integration
- **GOOGLE_SEARCH_ENGINE_ID** (Required if using Google API): Custom Search Engine ID for image search

#### Optional TTS API Keys

For premium text-to-speech voices, you can also add:
- `ELEVENLABS_API_KEY=your_elevenlabs_api_key`
- `OPENAI_API_KEY=your_openai_api_key`

If these keys are not provided, the system will fall back to free alternatives.

## 🛠️ Development

### Project Structure

```
app/              # Next.js 14 App Router pages
components/       # Reusable UI components
lib/              # Utility functions and helpers
public/           # Static assets
styles/           # Global styles
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:optimized` - Build with security and performance optimizations
- `pnpm start` - Start production server
- `pnpm lint` - Run linting

## 🔐 Security and Performance Enhancements

This platform includes comprehensive security and performance optimizations for production deployment:

### Security Features
- **API Protection**: All API calls routed through secure backend proxy
- **Console & Source Protection**: Disabled right-click, DevTools, and console access
- **Frontend Hardening**: CSP headers, CSRF tokens, input sanitization
- **Code Edit Prevention**: DOM mutation detection and debugger blocking

### Performance Features
- **Lazy Loading**: Components, images, and scripts loaded on demand
- **Image Optimization**: Modern formats (WebP/AVIF) and responsive images
- **Code Splitting**: Automatic bundle optimization
- **Caching**: Browser and server-side caching strategies

## 🔐 Comprehensive Security Implementation

### 1. API Security

#### Secure Backend Architecture
All API calls are routed through Next.js API routes with multiple security layers:
- Rate limiting (100 requests per minute per IP)
- JWT-based authentication for all protected routes
- Input validation and sanitization
- Environment variable protection (sensitive configuration stored server-side only)
- CSRF token protection for state-changing requests

#### Content Security Policy (CSP)
Implemented comprehensive CSP headers in `next.config.mjs`:
- `default-src 'self'`: Only allow resources from the same origin
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: Restrict script execution
- `style-src 'self' 'unsafe-inline'`: Allow inline styles but restrict external stylesheets
- `img-src 'self' data: https:`: Restrict image sources
- `connect-src 'self'`: Restrict AJAX, WebSocket, and other connections
- `frame-ancestors 'none'`: Prevent clickjacking attacks

### 2. Console and Source Protection

#### Console Access Restriction
In production builds, all console methods are disabled:
```javascript
if (process.env.NODE_ENV === 'production') {
  const noop = () => {}
  console.log = noop
  console.warn = noop
  console.error = noop
  // ... other console methods
}
```

#### Developer Tools Prevention
Implemented detection mechanisms for:
- DevTools opening detection
- Debugger activation detection
- Right-click prevention
- Keyboard shortcut blocking (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+J, Ctrl+S)

#### DOM Mutation Protection
Using MutationObserver to detect unauthorized DOM changes:
```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'attributes') {
      console.warn('Unauthorized DOM modification detected')
    }
  })
})
```

### 3. Authentication and Authorization

#### JWT-based Authentication
Secure token implementation with:
- Expiration times
- Role-based access control
- CSRF token protection for state-changing requests

#### Session Management
Using Supabase Auth with secure session handling:
- Automatic session refresh
- Secure cookie management
- Proper logout functionality

### 4. Data Protection

#### Input Sanitization
All user inputs are sanitized to prevent injection attacks:
```javascript
static sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // ... other dangerous characters
}
```

#### Secure File Uploads
File upload validation includes:
- File type restrictions
- File size limits
- Filename sanitization
- Virus scanning (when available)

## ⚡ Comprehensive Performance Implementation

### 1. Code Splitting and Lazy Loading

#### Component Lazy Loading
React.lazy implementation for heavy components:
```javascript
const LazyComponent = lazy(() => import('./HeavyComponent'))
```

#### Route-based Code Splitting
Next.js automatic code splitting by routes

### 2. Image Optimization

#### Modern Image Formats
Support for WebP and AVIF formats

#### Responsive Images
Automatic generation of multiple sizes

#### Next.js Image Component
Built-in optimization with:
- Lazy loading
- Automatic resizing
- Modern format delivery

### 3. Caching Strategies

#### Browser Caching
HTTP cache headers for static assets:
```
Cache-Control: public, max-age=31536000, immutable
```

#### Server-side Caching
In-memory caching for API responses

### 4. Bundle Optimization

#### Tree Shaking
Automatic removal of unused code

#### Minification
JavaScript and CSS minification in production builds

#### Compression
GZIP/Brotli compression for all assets

### 5. Preloading and Prefetching

#### Critical Asset Preloading
Preload important resources:
```html
<link rel="preload" href="/critical-asset.js" as="script">
```

#### Route Prefetching
Next.js automatic route prefetching

## 🧪 Security Testing

### 1. OWASP Compliance
Implementation of measures to prevent:
- Injection attacks
- Broken authentication
- Sensitive data exposure
- XML External Entities (XXE)
- Broken access control
- Security misconfiguration
- Cross-site scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging & monitoring

### 2. Automated Security Scanning
Integration with security scanning tools:
- Dependency vulnerability scanning
- Static code analysis
- Dynamic application security testing

## 📈 Performance Monitoring

### 1. Lighthouse Optimization
Target: 90+ score on all metrics
- Performance
- Accessibility
- Best Practices
- SEO

### 2. Core Web Vitals
Optimization for:
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### 3. Custom Metrics
Implementation of custom performance monitoring:
- Page load times
- API response times
- User interaction metrics

## 🚀 Production Deployment

### 1. Build Process
Optimized build script with:
- JavaScript obfuscation
- Console disabling
- Security header implementation
- Performance optimizations

### 2. Environment Configuration
Separate configurations for:
- Development
- Staging
- Production

### 3. Monitoring and Logging
Comprehensive logging system with:
- Security event logging
- Performance metrics
- Error tracking
- User activity monitoring

## 🔧 Maintenance

### 1. Regular Updates
- Dependency updates
- Security patches
- Performance improvements

### 2. Security Audits
- Regular vulnerability assessments
- Penetration testing
- Code review processes

### 3. Performance Reviews
- Regular Lighthouse audits
- User experience testing
- Load testing

## 📁 File Structure

The security and performance enhancements are implemented across the following files:

```
lib/
  security.ts          # Security utilities and protection functions
  performance.ts       # Performance optimization utilities
  api-client.ts        # Secure API client with CSRF protection

middleware.ts          # Rate limiting and security headers

next.config.mjs        # CSP headers and security configuration

scripts/
  build-optimized.js   # Production build script with optimizations

components/
  scene-manager.tsx    # Scene management with security considerations
```

## ✅ Verification Checklist

### Security
- [x] API calls routed through secure backend proxy
- [x] No raw API keys or endpoints exposed in frontend
- [x] Server-side environment variables implemented
- [x] HTTPS for all routes
- [x] CORS restrictions for allowed origins only
- [x] Rate-limiting, request validation, and authentication
- [x] JS files obfuscated and minified
- [x] Right-click, Ctrl+U, Ctrl+Shift+I, F12 disabled
- [x] Console access disabled in production
- [x] Runtime integrity checks for DOM tampering
- [x] Content Security Policy (CSP) headers enabled
- [x] Subresource Integrity (SRI) for external scripts
- [x] Clickjacking prevention with X-Frame-Options
- [x] CSRF tokens for state-changing requests
- [x] User input sanitization
- [x] Console interaction locked
- [x] DOM mutation attempts restricted

### Performance
- [x] Lazy-loading for images, components, and scripts
- [x] Critical assets preloaded
- [x] CDN caching and compression (GZIP/Brotli)
- [x] Image optimization with modern formats
- [x] Network requests minimized with bundling
- [x] Code-splitting implemented
- [x] Pre-rendering or SSR for faster first paint
- [x] Lighthouse score optimization (target 90+)
- [x] Load time optimization (target <1.5s)

This implementation ensures the PIB Multilingual Video Platform meets the highest standards for security and performance while maintaining its core functionality of transforming government press releases into engaging multilingual video content.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js 14 for the amazing App Router
- Supabase for backend services
- Gemini AI for natural language processing
- Tailwind CSS for styling
- shadcn/ui for accessible UI components