import { withPluginApi } from "discourse/lib/plugin-api";

function initializeSkeletonLoading(api) {
  const settings = api.container.lookup("site-settings:main");
  
  if (!settings.skeleton_loading_enabled) {
    return;
  }
  
  let skeletonOverlay = null;
  let loadingTimeout = null;
  
  function createSkeletonOverlay() {
    const overlay = document.createElement('div');
    overlay.className = `skeleton-loading-overlay ${settings.skeleton_loading_style}`;
    
    // Create skeleton content
    overlay.innerHTML = `
      <div class="skeleton-item skeleton-header"></div>
      <div class="skeleton-item skeleton-line"></div>
      <div class="skeleton-item skeleton-line"></div>
      <div class="skeleton-item skeleton-line short"></div>
      <div class="skeleton-item skeleton-line"></div>
      <div class="skeleton-item skeleton-line"></div>
      <div class="skeleton-item skeleton-line short"></div>
      <div style="display: flex; align-items: center; margin: 20px 0;">
        <div class="skeleton-item skeleton-avatar"></div>
        <div style="flex: 1;">
          <div class="skeleton-item skeleton-paragraph"></div>
          <div class="skeleton-item skeleton-paragraph"></div>
        </div>
      </div>
      <div class="skeleton-item skeleton-line"></div>
      <div class="skeleton-item skeleton-line"></div>
      <div class="skeleton-item skeleton-line short"></div>
      <div style="margin-top: 20px;">
        <div class="skeleton-item skeleton-button"></div>
        <div class="skeleton-item skeleton-button"></div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  function showSkeletonLoading() {
    if (skeletonOverlay) {
      hideSkeletonLoading();
    }
    
    skeletonOverlay = createSkeletonOverlay();
    
    // Trigger reflow to ensure transition works
    skeletonOverlay.offsetHeight;
    
    // Add active class to trigger fade in
    skeletonOverlay.classList.add('active');
    
    // Auto-hide after specified duration
    loadingTimeout = setTimeout(() => {
      hideSkeletonLoading();
    }, settings.skeleton_loading_duration);
  }
  
  function hideSkeletonLoading() {
    if (skeletonOverlay) {
      skeletonOverlay.classList.remove('active');
      
      setTimeout(() => {
        if (skeletonOverlay && skeletonOverlay.parentNode) {
          skeletonOverlay.parentNode.removeChild(skeletonOverlay);
        }
        skeletonOverlay = null;
      }, 300);
    }
    
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
  }
  
  function isExternalLink(url) {
    try {
      const linkHost = new URL(url).hostname;
      const currentHost = window.location.hostname;
      return linkHost !== currentHost;
    } catch (e) {
      return false;
    }
  }
  
  function shouldShowSkeleton(link) {
    const href = link.getAttribute('href');
    
    // Skip if no href
    if (!href) return false;
    
    // Skip if it's just an anchor link
    if (href.startsWith('#')) return false;
    
    // Skip external links if setting is enabled
    if (settings.exclude_external_links && isExternalLink(href)) {
      return false;
    }
    
    // Skip if it opens in new tab/window
    if (link.target === '_blank') return false;
    
    // Skip if it has download attribute
    if (link.hasAttribute('download')) return false;
    
    // Skip if it's a JavaScript link
    if (href.startsWith('javascript:')) return false;
    
    // Skip if it's a mailto or tel link
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    
    return true;
  }
  
  // Add click listener to all links
  function attachLinkListeners() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      
      if (link && shouldShowSkeleton(link)) {
        showSkeletonLoading();
      }
    });
  }
  
  // Hide skeleton on page load/navigation
  function attachNavigationListeners() {
    // Hide on page load
    window.addEventListener('load', hideSkeletonLoading);
    
    // Hide on popstate (back/forward)
    window.addEventListener('popstate', hideSkeletonLoading);
    
    // Hide on Discourse route change
    api.onPageChange(() => {
      hideSkeletonLoading();
    });
  }
  
  // Initialize
  attachLinkListeners();
  attachNavigationListeners();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    hideSkeletonLoading();
  });
}

export default {
  name: "skeleton-loading",
  initialize() {
    withPluginApi("0.8.31", initializeSkeletonLoading);
  }
};
