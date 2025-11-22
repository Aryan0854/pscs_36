// Performance optimization utilities
import { NextRequest } from 'next/server'

export class PerformanceUtils {
  // Lazy loading implementation for components
  static lazyLoadComponent(importFunc: () => Promise<any>, fallback: React.ReactNode = null) {
    // This is a utility function that would be used in React components
    // The actual implementation would be in the component file using React.lazy
    return { importFunc, fallback }
  }

  // Image optimization helper
  static optimizeImage(src: string, width?: number, quality = 75): string {
    // In a real implementation, you would use Next.js Image component
    // This is a simplified version for demonstration
    const params = new URLSearchParams()
    if (width) params.append('w', width.toString())
    params.append('q', quality.toString())
    
    return src
  }

  // Preload critical assets
  static preloadAssets(assets: { url: string; as: string }[]) {
    if (typeof window !== 'undefined') {
      assets.forEach(asset => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = asset.url
        link.as = asset.as
        document.head.appendChild(link)
      })
    }
  }

  // Enable GZIP/Brotli compression (server-side)
  static enableCompression() {
    // This would be implemented in server configuration
    // For Next.js, this is handled automatically in production
  }

  // Code splitting helper
  static codeSplitComponent(component: React.ComponentType<any>) {
    // Next.js automatically code splits dynamic imports
    // This is just a placeholder for the concept
    return component
  }

  // Cache control headers
  static setCacheHeaders(res: any, maxAge = 31536000) {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`)
  }

  // Implement lazy loading for images (returns image attributes object)
  static lazyLoadImageAttributes(): { loading: "lazy"; decoding: "async" } {
    return {
      loading: "lazy",
      decoding: "async"
    };
  }

  // Implement critical CSS inlining
  static inlineCriticalCSS(css: string): void {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  // Implement font optimization
  static optimizeFont(fontUrl: string): void {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }

  // Implement resource hints
  static addResourceHints(urls: { url: string; type: 'preconnect' | 'dns-prefetch' | 'prefetch' | 'prerender' }[]): void {
    if (typeof document !== 'undefined') {
      urls.forEach(({ url, type }) => {
        const link = document.createElement('link');
        link.rel = type;
        link.href = url;
        if (type === 'preconnect') {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    }
  }
}