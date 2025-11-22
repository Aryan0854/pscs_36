// Security utilities for frontend protection
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export class SecurityUtils {
  // Rate limiting implementation
  static async rateLimit(request: NextRequest, maxRequests = 100, windowMs = 60000): Promise<boolean> {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const key = `rate-limit:${ip}`
    const now = Date.now()
    
    const rateLimitData = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
    
    // Reset counter if window has passed
    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 0
      rateLimitData.resetTime = now + windowMs
    }
    
    // Increment request count
    rateLimitData.count++
    rateLimitStore.set(key, rateLimitData)
    
    // Check if limit exceeded
    return rateLimitData.count <= maxRequests
  }

  // Input sanitization
  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // CSRF token generation (simplified for demo)
  static generateCSRFToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Validate CSRF token
  static validateCSRFToken(token: string, expected: string): boolean {
    return token === expected
  }

  // Enhanced XSS protection
  static sanitizeHTML(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Enhanced security headers for API responses
  static applySecurityHeaders(res: NextResponse): void {
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }
}

// Console protection for production
export function protectConsole() {
  if (process.env.NODE_ENV === 'production') {
    // Disable console methods
    const noop = () => {}
    console.log = noop
    console.warn = noop
    console.error = noop
    console.info = noop
    console.debug = noop
    console.trace = noop
    
    // Prevent DevTools detection
    let devtools = {
      open: false,
      orientation: 'vertical'
    }
    
    const threshold = 160
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        devtools.open = true
        // Redirect to security violation page
        if (typeof window !== 'undefined' && window.location) {
          // window.location.href = '/security-violation'; // Uncomment in production
        }
      }
    }, 500)
    
    // Freeze execution if debugger is detected
    const devtoolsDetector = () => {
      if (typeof window !== 'undefined') {
        let start = new Date().getTime();
        debugger;
        let end = new Date().getTime();
        
        if (end - start > 100) {
          // Debugger detected - freeze application
          Object.freeze(window);
          if (typeof document !== 'undefined') {
            document.body.innerHTML = '<h1>Security Violation Detected</h1><p>Debugging is not allowed.</p>';
          }
          throw new Error('Debugger detected');
        }
      }
    };
    
    setInterval(devtoolsDetector, 1000);
  }
}

// DOM mutation protection
export function protectDOM() {
  if (process.env.NODE_ENV === 'production') {
    // Create a MutationObserver to detect DOM changes
    if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            // Log unauthorized DOM changes
            console.warn('Unauthorized DOM modification detected');
            // In a real implementation, you might want to take stronger actions
            // such as reloading the page or reporting to a security service
          }
        });
      });
      
      // Start observing
      if (typeof document !== 'undefined') {
        observer.observe(document, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeOldValue: true
        });
      }
    }
    
    // Prevent right-click and developer tools shortcuts
    if (typeof document !== 'undefined') {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
      
      document.addEventListener('keydown', (e) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+J
        if (
          e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
          (e.ctrlKey && e.shiftKey && e.keyCode === 74) // Ctrl+Shift+J
        ) {
          e.preventDefault();
          return false;
        }
        
        // Disable Ctrl+S (save)
        if (e.ctrlKey && e.keyCode === 83) {
          e.preventDefault();
          return false;
        }
      });
      
      // Disable drag and drop of elements
      document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });
    }
  }
}

// JWT token validation (simplified)
export function validateJWT(token: string): boolean {
  try {
    // In a real implementation, you would verify the JWT signature
    // This is a simplified version for demonstration
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch (error) {
    return false;
  }
}

// Anti-tampering protection
export function protectIntegrity() {
  if (process.env.NODE_ENV === 'production') {
    // Periodically check critical functions haven't been tampered with
    const criticalFunctions = [
      { name: 'console.log', fn: console.log },
      { name: 'console.warn', fn: console.warn },
      { name: 'console.error', fn: console.error }
    ];
    
    setInterval(() => {
      criticalFunctions.forEach(({ name, fn }) => {
        if (typeof fn !== 'function') {
          throw new Error(`Integrity violation: ${name} has been tampered with`);
        }
      });
    }, 5000);
  }
}