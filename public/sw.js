/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

importScripts(
  "/_next/precache.Lxi-_cOwLJycyMPhNbmEE.ed1bb66e367d4e49c7b01751acdcab44.js"
);

workbox.core.skipWaiting();

workbox.core.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "/album.png",
    "revision": "af04941bc8bce6b9bb7c8b505d6c9f42"
  },
  {
    "url": "/android/android-launchericon-144-144.png",
    "revision": "6294809804d61f15f1c8393a56f55bd4"
  },
  {
    "url": "/android/android-launchericon-192-192.png",
    "revision": "e844a6b189c257c59a6c917ea212f987"
  },
  {
    "url": "/android/android-launchericon-48-48.png",
    "revision": "6d20335dc97958511eae40d94f344b69"
  },
  {
    "url": "/android/android-launchericon-512-512.png",
    "revision": "128d6ca8ef2bf897e4642aef843440d9"
  },
  {
    "url": "/android/android-launchericon-72-72.png",
    "revision": "af25e1b5690f6585b0ab9996e7124b3e"
  },
  {
    "url": "/android/android-launchericon-96-96.png",
    "revision": "1af2e3a20bdb1df5b850f309048f8a40"
  },
  {
    "url": "/favi-icon.jpg",
    "revision": "bb47115fad489b07f265ff22b3e593e0"
  },
  {
    "url": "/feed.png",
    "revision": "56aa2eca9d4f245f9a564e6587902fd0"
  },
  {
    "url": "/ios/100.png",
    "revision": "7812463704c36b9ce4c1f12c6e8ee9c3"
  },
  {
    "url": "/ios/1024.png",
    "revision": "6370d35c979a7b94827d9bb6c68be008"
  },
  {
    "url": "/ios/114.png",
    "revision": "b188563bb35c7b0f16a7b9f1b804d208"
  },
  {
    "url": "/ios/120.png",
    "revision": "cdb9caaeaf582eb1d5af516121d89aa5"
  },
  {
    "url": "/ios/128.png",
    "revision": "38b780425cb71a287fdfd7f94d9bc21c"
  },
  {
    "url": "/ios/144.png",
    "revision": "6294809804d61f15f1c8393a56f55bd4"
  },
  {
    "url": "/ios/152.png",
    "revision": "e64c798b5243bacae352087db7681c0f"
  },
  {
    "url": "/ios/16.png",
    "revision": "ded4ccb071bdcd33020ea1904d971c85"
  },
  {
    "url": "/ios/167.png",
    "revision": "8c47b267f8556d7b3d26749691af54fb"
  },
  {
    "url": "/ios/180.png",
    "revision": "8310848d33dbff6bcb4e41cbd54336f1"
  },
  {
    "url": "/ios/192.png",
    "revision": "e844a6b189c257c59a6c917ea212f987"
  },
  {
    "url": "/ios/20.png",
    "revision": "37afda4e9971b66c03b242ef5299f736"
  },
  {
    "url": "/ios/256.png",
    "revision": "539641a96579e2b9dbc8938ef7f6f95c"
  },
  {
    "url": "/ios/29.png",
    "revision": "0da65878adc82a3e776a79a18947e031"
  },
  {
    "url": "/ios/32.png",
    "revision": "b9d1c4b991cc420d05e01ec29ee79cf4"
  },
  {
    "url": "/ios/40.png",
    "revision": "25c53bd7c1ca5aca3b592c5a69bf6dd3"
  },
  {
    "url": "/ios/50.png",
    "revision": "6f791dbe3e4b6c253bd7c268bba5b249"
  },
  {
    "url": "/ios/512.png",
    "revision": "128d6ca8ef2bf897e4642aef843440d9"
  },
  {
    "url": "/ios/57.png",
    "revision": "7ab4810517197140947863e26754506a"
  },
  {
    "url": "/ios/58.png",
    "revision": "d4ed01c57e687ece5056540c66ed3990"
  },
  {
    "url": "/ios/60.png",
    "revision": "4d5d36af38a8409abc8698e93c96a01e"
  },
  {
    "url": "/ios/64.png",
    "revision": "a399a03fd9228d93b90d575f49eb64a1"
  },
  {
    "url": "/ios/72.png",
    "revision": "af25e1b5690f6585b0ab9996e7124b3e"
  },
  {
    "url": "/ios/76.png",
    "revision": "74281574fa7a726f2dd830fc2e721959"
  },
  {
    "url": "/ios/80.png",
    "revision": "17aceeb1264becf674e7607e7f47392f"
  },
  {
    "url": "/ios/87.png",
    "revision": "662ef21976a447ba65f91d2d10eba188"
  },
  {
    "url": "/manifest.json",
    "revision": "98f4deb54d0ddd47bed8816064a97d8d"
  },
  {
    "url": "/player-1.png",
    "revision": "f7be5ee40b513a1a72a7a4033575d5a9"
  },
  {
    "url": "/player-2.png",
    "revision": "64d19e170a534ba0a2a403b6e228348c"
  },
  {
    "url": "/search-feed.png",
    "revision": "0eda1097edbb923b3b55923f7abc287b"
  },
  {
    "url": "/windows11/LargeTile.scale-100.png",
    "revision": "12af12d4aa02a362a27830e025e8f087"
  },
  {
    "url": "/windows11/LargeTile.scale-125.png",
    "revision": "1f759cb3c31ce8efb3c1af16582b362c"
  },
  {
    "url": "/windows11/LargeTile.scale-150.png",
    "revision": "0f40344fcb4172516337d5f49b01a1f4"
  },
  {
    "url": "/windows11/LargeTile.scale-200.png",
    "revision": "35fee16d676074286ef7a84a0fd6133b"
  },
  {
    "url": "/windows11/LargeTile.scale-400.png",
    "revision": "65f1119c2aab2f64808ef40e2af1eb2b"
  },
  {
    "url": "/windows11/SmallTile.scale-100.png",
    "revision": "ce0cbf86701e2b34bac40988add12c7b"
  },
  {
    "url": "/windows11/SmallTile.scale-125.png",
    "revision": "1d7703e9a7b2d1e1dac78622dcfec576"
  },
  {
    "url": "/windows11/SmallTile.scale-150.png",
    "revision": "8b54e9f9b32288c4587e1002b7278330"
  },
  {
    "url": "/windows11/SmallTile.scale-200.png",
    "revision": "97dc7a7bd24206eb2d7390efac9ac860"
  },
  {
    "url": "/windows11/SmallTile.scale-400.png",
    "revision": "dca142744df364e19b4774b26b97c724"
  },
  {
    "url": "/windows11/SplashScreen.scale-100.png",
    "revision": "ec23df08f215f9bc0fb5b5b46723712c"
  },
  {
    "url": "/windows11/SplashScreen.scale-125.png",
    "revision": "7c01ef0205b5bbf156755af45edbac38"
  },
  {
    "url": "/windows11/SplashScreen.scale-150.png",
    "revision": "5f3a13c5572eea10ab4564a3b7e2f8db"
  },
  {
    "url": "/windows11/SplashScreen.scale-200.png",
    "revision": "892a8bde96bba7b4dd2de74d6b9c9a2d"
  },
  {
    "url": "/windows11/SplashScreen.scale-400.png",
    "revision": "852b44e4b84e706de2737227cfed383e"
  },
  {
    "url": "/windows11/Square150x150Logo.scale-100.png",
    "revision": "d1989c8b07b044776e80465ab80c9c5a"
  },
  {
    "url": "/windows11/Square150x150Logo.scale-125.png",
    "revision": "e054a4792ef72611f8ac0a13b872bb4e"
  },
  {
    "url": "/windows11/Square150x150Logo.scale-150.png",
    "revision": "0e8b4a6d202ee68298a77e0d0851b6ac"
  },
  {
    "url": "/windows11/Square150x150Logo.scale-200.png",
    "revision": "c165e5f405761ebcd2a2f04cdd20a4a2"
  },
  {
    "url": "/windows11/Square150x150Logo.scale-400.png",
    "revision": "0aa107bdf8378b5420618eb75dfd74f0"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-16.png",
    "revision": "ded4ccb071bdcd33020ea1904d971c85"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-20.png",
    "revision": "37afda4e9971b66c03b242ef5299f736"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-24.png",
    "revision": "bd8a0ab0c635a06878c518bede9fd9c7"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-256.png",
    "revision": "539641a96579e2b9dbc8938ef7f6f95c"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-30.png",
    "revision": "c0e11f17aabd912e75421fd076a84416"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-32.png",
    "revision": "b9d1c4b991cc420d05e01ec29ee79cf4"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-36.png",
    "revision": "70816f2fc4e4dfb09dad99abc2322c9d"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-40.png",
    "revision": "25c53bd7c1ca5aca3b592c5a69bf6dd3"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-44.png",
    "revision": "2e65a4221bc1c6b6087458db151c8e4b"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-48.png",
    "revision": "6d20335dc97958511eae40d94f344b69"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-60.png",
    "revision": "4d5d36af38a8409abc8698e93c96a01e"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-64.png",
    "revision": "a399a03fd9228d93b90d575f49eb64a1"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-72.png",
    "revision": "af25e1b5690f6585b0ab9996e7124b3e"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-80.png",
    "revision": "17aceeb1264becf674e7607e7f47392f"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-lightunplated_targetsize-96.png",
    "revision": "1af2e3a20bdb1df5b850f309048f8a40"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-16.png",
    "revision": "ded4ccb071bdcd33020ea1904d971c85"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-20.png",
    "revision": "37afda4e9971b66c03b242ef5299f736"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-24.png",
    "revision": "bd8a0ab0c635a06878c518bede9fd9c7"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-256.png",
    "revision": "539641a96579e2b9dbc8938ef7f6f95c"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-30.png",
    "revision": "c0e11f17aabd912e75421fd076a84416"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-32.png",
    "revision": "b9d1c4b991cc420d05e01ec29ee79cf4"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-36.png",
    "revision": "70816f2fc4e4dfb09dad99abc2322c9d"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-40.png",
    "revision": "25c53bd7c1ca5aca3b592c5a69bf6dd3"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-44.png",
    "revision": "2e65a4221bc1c6b6087458db151c8e4b"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-48.png",
    "revision": "6d20335dc97958511eae40d94f344b69"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-60.png",
    "revision": "4d5d36af38a8409abc8698e93c96a01e"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-64.png",
    "revision": "a399a03fd9228d93b90d575f49eb64a1"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-72.png",
    "revision": "af25e1b5690f6585b0ab9996e7124b3e"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-80.png",
    "revision": "17aceeb1264becf674e7607e7f47392f"
  },
  {
    "url": "/windows11/Square44x44Logo.altform-unplated_targetsize-96.png",
    "revision": "1af2e3a20bdb1df5b850f309048f8a40"
  },
  {
    "url": "/windows11/Square44x44Logo.scale-100.png",
    "revision": "2e65a4221bc1c6b6087458db151c8e4b"
  },
  {
    "url": "/windows11/Square44x44Logo.scale-125.png",
    "revision": "0834304b7f76d5c8d4f1fcb09b8e1c03"
  },
  {
    "url": "/windows11/Square44x44Logo.scale-150.png",
    "revision": "18053bf41ce74056276f7b4d475ae847"
  },
  {
    "url": "/windows11/Square44x44Logo.scale-200.png",
    "revision": "a3f9ec07ed16d36b844ed517017ae920"
  },
  {
    "url": "/windows11/Square44x44Logo.scale-400.png",
    "revision": "45139ebc26648b88db03c303edc21dd8"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-16.png",
    "revision": "ded4ccb071bdcd33020ea1904d971c85"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-20.png",
    "revision": "37afda4e9971b66c03b242ef5299f736"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-24.png",
    "revision": "bd8a0ab0c635a06878c518bede9fd9c7"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-256.png",
    "revision": "539641a96579e2b9dbc8938ef7f6f95c"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-30.png",
    "revision": "c0e11f17aabd912e75421fd076a84416"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-32.png",
    "revision": "b9d1c4b991cc420d05e01ec29ee79cf4"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-36.png",
    "revision": "70816f2fc4e4dfb09dad99abc2322c9d"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-40.png",
    "revision": "25c53bd7c1ca5aca3b592c5a69bf6dd3"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-44.png",
    "revision": "2e65a4221bc1c6b6087458db151c8e4b"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-48.png",
    "revision": "6d20335dc97958511eae40d94f344b69"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-60.png",
    "revision": "4d5d36af38a8409abc8698e93c96a01e"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-64.png",
    "revision": "a399a03fd9228d93b90d575f49eb64a1"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-72.png",
    "revision": "af25e1b5690f6585b0ab9996e7124b3e"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-80.png",
    "revision": "17aceeb1264becf674e7607e7f47392f"
  },
  {
    "url": "/windows11/Square44x44Logo.targetsize-96.png",
    "revision": "1af2e3a20bdb1df5b850f309048f8a40"
  },
  {
    "url": "/windows11/StoreLogo.scale-100.png",
    "revision": "0a3e343797a42ba51e552fd39fc8d91c"
  },
  {
    "url": "/windows11/StoreLogo.scale-125.png",
    "revision": "e1b0e6cfabf66d6f55d0a32ebd798943"
  },
  {
    "url": "/windows11/StoreLogo.scale-150.png",
    "revision": "6ad45c044cf4fddc1b26bd4f5c42880b"
  },
  {
    "url": "/windows11/StoreLogo.scale-200.png",
    "revision": "5cf35ab397f8769506b957f749170e58"
  },
  {
    "url": "/windows11/StoreLogo.scale-400.png",
    "revision": "2bff158b0cd6fb6ef0a941e9ea364385"
  },
  {
    "url": "/windows11/Wide310x150Logo.scale-100.png",
    "revision": "3731561a2f2be6858ad1e9559dbb0b4b"
  },
  {
    "url": "/windows11/Wide310x150Logo.scale-125.png",
    "revision": "2c138fce049576c3cf2dc00df132a86e"
  },
  {
    "url": "/windows11/Wide310x150Logo.scale-150.png",
    "revision": "1835dbd461613ba7cc5476c78814d4ff"
  },
  {
    "url": "/windows11/Wide310x150Logo.scale-200.png",
    "revision": "ec23df08f215f9bc0fb5b5b46723712c"
  },
  {
    "url": "/windows11/Wide310x150Logo.scale-400.png",
    "revision": "892a8bde96bba7b4dd2de74d6b9c9a2d"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.precaching.cleanupOutdatedCaches();

workbox.routing.registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i, new workbox.strategies.CacheFirst({ "cacheName":"google-fonts", plugins: [new workbox.expiration.Plugin({ maxEntries: 4, maxAgeSeconds: 31536000, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/^https:\/\/use\.fontawesome\.com\/releases\/.*/i, new workbox.strategies.CacheFirst({ "cacheName":"font-awesome", plugins: [new workbox.expiration.Plugin({ maxEntries: 1, maxAgeSeconds: 31536000, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"static-font-assets", plugins: [new workbox.expiration.Plugin({ maxEntries: 4, maxAgeSeconds: 604800, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"static-image-assets", plugins: [new workbox.expiration.Plugin({ maxEntries: 64, maxAgeSeconds: 86400, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/\.(?:js)$/i, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"static-js-assets", plugins: [new workbox.expiration.Plugin({ maxEntries: 16, maxAgeSeconds: 86400, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/\.(?:css|less)$/i, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"static-style-assets", plugins: [new workbox.expiration.Plugin({ maxEntries: 16, maxAgeSeconds: 86400, purgeOnQuotaError: false })] }), 'GET');
workbox.routing.registerRoute(/.*/i, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"others", plugins: [new workbox.expiration.Plugin({ maxEntries: 16, maxAgeSeconds: 86400, purgeOnQuotaError: false })] }), 'GET');
