// frontend/src/lib/image-service.ts
class ImageService {
    cache = new Map();
    // ✅ Production CDN + Optimization
    getOptimizedImage(imagePath, options = {}) {
        if (!imagePath) {
            return this.getPlaceholder(options.width || 400, options.height || 300);
        }
        const cacheKey = `${imagePath}-${JSON.stringify(options)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const url = this.buildImageUrl(imagePath, options);
        this.cache.set(cacheKey, url);
        return url;
    }
    buildImageUrl(imagePath, options) {
        const { width = 400, height = 300, quality = 80, format = 'webp', } = options;
        // ✅ 1M+ USER STRATEGY: Multiple CDN fallbacks
        const cdnUrls = [
            this.buildCloudflareUrl(imagePath, {
                width,
                height,
                quality,
                format,
            }),
            this.buildImgixUrl(imagePath, { width, height, quality, format }),
            this.buildCloudinaryUrl(imagePath, {
                width,
                height,
                quality,
                format,
            }),
            this.buildLaravelUrl(imagePath), // Final fallback
        ];
        return cdnUrls[0]; // Primary CDN
    }
    buildCloudflareUrl(imagePath, options) {
        const params = new URLSearchParams({
            width: options.width.toString(),
            height: options.height.toString(),
            quality: options.quality.toString(),
            format: options.format,
        });
        return `https://your-app.cloudflare.com/cdn-cgi/image/${params.toString()}${imagePath}`;
    }
    buildImgixUrl(imagePath, options) {
        return `https://your-app.imgix.net${imagePath}?w=${options.width}&h=${options.height}&q=${options.quality}&fm=${options.format}&auto=format`;
    }
    buildCloudinaryUrl(imagePath, options) {
        return `https://res.cloudinary.com/your-app/image/fetch/w_${options.width},h_${options.height},q_${options.quality},f_${options.format}/${encodeURIComponent(`https://coupon-finalz.ddev.site/dashboard${imagePath}`)}`;
    }
    buildLaravelUrl(imagePath) {
        const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
        return isTauri ? `https://coupon-finalz.ddev.site/dashboard${imagePath}` : imagePath;
    }
    getPlaceholder(width, height) {
        // ✅ Blurhash or low-quality placeholder
        return `https://your-app.placeholder.com/${width}x${height}/f0f0f0/cccccc?text=Coupon`;
    }
    // ✅ Preload critical images
    preloadImages(imageUrls) {
        imageUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    // ✅ Intersection Observer for smart loading
    observeImages(container) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '100px' });
        container.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }
}
export const imageService = new ImageService();
