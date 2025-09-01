/**
 * StudyPay Service Worker
 * Handles offline caching, push notifications, and background sync
 */

const CACHE_NAME = 'studypay-v1.0.0';
const STATIC_CACHE_NAME = 'studypay-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'studypay-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/student',
  '/parent',
  '/vendor',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Solana RPC endpoints (for offline transaction viewing)
  // Icons and images
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Dynamic cache patterns
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  solana: 'network-first',
  static: 'cache-first'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing StudyPay Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating StudyPay Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first
    event.respondWith(networkFirst(request));
  } else if (url.pathname.includes('solana')) {
    // Solana RPC requests - network first with short cache
    event.respondWith(networkFirst(request, 300)); // 5 minutes
  } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    // Images - cache first
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Next.js static assets - cache first
    event.respondWith(cacheFirst(request));
  } else {
    // Pages and other assets - network first
    event.respondWith(networkFirst(request));
  }
});

// Cache strategies
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

async function networkFirst(request, maxAge = 3600) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      // Add cache control headers
      const responseWithHeaders = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-at': Date.now().toString(),
          'sw-max-age': maxAge.toString()
        }
      });
      
      cache.put(request, responseWithHeaders.clone());
      return responseWithHeaders;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network first fallback to cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still fresh
      const cachedAt = parseInt(cachedResponse.headers.get('sw-cached-at') || '0');
      const maxAgeSeconds = parseInt(cachedResponse.headers.get('sw-max-age') || '3600');
      const isExpired = Date.now() - cachedAt > maxAgeSeconds * 1000;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    return new Response('Service unavailable', { status: 503 });
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notification = {
    title: 'StudyPay Notification',
    body: 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'studypay-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notification = { ...notification, ...data };
    } catch (error) {
      console.log('[SW] Error parsing push data:', error);
      notification.body = event.data.text() || notification.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  let urlToOpen = '/';
  
  if (notificationData.url) {
    urlToOpen = notificationData.url;
  } else if (notificationData.type) {
    switch (notificationData.type) {
      case 'payment_received':
      case 'payment_sent':
        urlToOpen = '/student';
        break;
      case 'transfer_received':
        urlToOpen = '/parent';
        break;
      case 'sale_completed':
        urlToOpen = '/vendor';
        break;
      default:
        urlToOpen = '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if StudyPay is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions());
  } else if (event.tag === 'sync-balance') {
    event.waitUntil(syncWalletBalance());
  }
});

async function syncOfflineTransactions() {
  try {
    console.log('[SW] Syncing offline transactions...');
    
    // Get pending transactions from IndexedDB or localStorage
    const pendingTransactions = await getPendingTransactions();
    
    for (const transaction of pendingTransactions) {
      try {
        // Attempt to process the transaction
        const result = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });
        
        if (result.ok) {
          // Remove from pending queue
          await removePendingTransaction(transaction.id);
          console.log('[SW] Transaction synced:', transaction.id);
        }
      } catch (error) {
        console.log('[SW] Failed to sync transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync transactions failed:', error);
  }
}

async function syncWalletBalance() {
  try {
    console.log('[SW] Syncing wallet balance...');
    // Implement balance sync logic
  } catch (error) {
    console.log('[SW] Sync balance failed:', error);
  }
}

// Helper functions for transaction queue management
async function getPendingTransactions() {
  // Implement IndexedDB or localStorage retrieval
  return [];
}

async function removePendingTransaction(transactionId) {
  // Implement removal from storage
}

// Periodic background tasks
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'balance-update') {
    event.waitUntil(syncWalletBalance());
  }
});

console.log('[SW] StudyPay Service Worker loaded successfully! 🚀');
