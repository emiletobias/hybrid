const version = 'v20171226';
const __DEVELOPMENT__ = true;
const __DEBUG__ = false;
const offlineResources = [];

const ignoreFetch = [
  /[^\s]*ver.js$/ig,
];


//////////
// Install
//////////
function onInstall(event) {
  log('install event in progress.');

  //event.waitUntil(updateStaticCache());
}

function updateStaticCache() {
  return caches
    .open(cacheKey('offline'))
    .then((cache) => {
      return cache.addAll(offlineResources);
    })
    .then(() => {
      log('installation complete!');
    });
}

////////
// Fetch
////////
function onFetch(event) {
  const request = event.request;

  if(request.url.match(/[^\s]*.html$/ig)){
      fetchDiff(request);
      return;
  }

  if (shouldAlwaysFetch(request)) {
    event.respondWith(networkedOrOffline(request));
    return;
  }

  if (shouldFetchAndCache(request)) {
    event.respondWith(networkedOrCached(request));
    return;
  }

  event.respondWith(cachedOrNetworked(request));
}

function getDiffHeader(response){
    var diffHeaders = {};

    for (var entry of response.headers.entries()) {
      switch(entry[0]){
        case "data-tag-array":
        case "etag":
        case "template-change":
        case "template-tag":
          diffHeaders[entry[0]] = entry[1];
          break;
      }
    }

    return diffHeaders;
}

function fetchDiff(request) {

  var headers = {};
  // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
  // notation as well and this is the only way of retrieving all the headers.
  for (var entry of request.headers.entries()) {
    headers[entry[0]] = entry[1];
  }

  headers['accept-diff'] = 'true';

  caches.match(request,{ ignoreSearch : true})
    .then((response)=>{
        if(response){
          var diff_header_request = getDiffHeader(response);
          Object.assign(headers,diff_header_request);
        }
    })
    .then(() => {
      var req = new Request(request.url, {
          method: request.method,
          headers: headers,
          mode: 'same-origin', // need to set this properly
          credentials: request.credentials,
          redirect: 'manual'   // let browser handle redirects
      });

      return fetch(req)
        .then((response) => {

          var diff = getDiffHeader(response);

          //etag 相等
          if(response.status == "304"){
            return response;
          }
          else{
            var copy = response.clone();

            //data变化,局部更新页面
            if(diff["template-change"] == "false"){

            }
            //template发生变化，刷新缓存并重刷页面
            else{

            }

            caches.open(cacheKey('diff'))
              .then((cache) => {
                cache.put(request, copy);
              });
          }
          //restruct response

          log("(network: cache write)", request.method, request.url);
          return response;
        });
    });




}

function networkedOrCached(request) {
  return networkedAndCache(request)
    .catch(() => { return cachedOrOffline(request) });
}

// Stash response in cache as side-effect of network request
function networkedAndCache(request) {
  return fetch(request)
    .then((response) => {
      var copy = response.clone();
      caches.open(cacheKey('resources'))
        .then((cache) => {
          cache.put(request, copy);
        });

      log("(network: cache write)", request.method, request.url);
      return response;
    });
}

function cachedOrNetworked(request) {
  return caches.match(request)
    .then((response) => {
      log(response ? '(cached)' : '(network: cache miss)', request.method, request.url);
      return response ||
        networkedAndCache(request)
          .catch(() => { return offlineResponse(request) });
    });
}

function networkedOrOffline(request) {
  return fetch(request)
    .then((response) => {
      log('(network)', request.method, request.url);
      return response;
    })
    .catch(() => {
      return offlineResponse(request);
    });
}

function cachedOrOffline(request) {
  return caches
    .match(request)
    .then((response) => {
      return response || offlineResponse(request);
    });
}

function offlineResponse(request) {
  log('(offline)', request.method, request.url);
  if (request.url.match(/\.(jpg|png|gif|svg|jpeg)(\?.*)?$/)) {
    return caches.match('/offline.svg');
  } else {
    return caches.match('/offline.html');
  }
}

///////////
// Activate
///////////
function onActivate(event) {
  log('activate event in progress.');
  event.waitUntil(removeOldCache());
}

function removeOldCache() {
  return caches
    .keys()
    .then((keys) => {
      return Promise.all( // We return a promise that settles when all outdated caches are deleted.
        keys
         .filter((key) => {
           return !key.startsWith(version); // Filter by keys that don't start with the latest version prefix.
         })
         .map((key) => {
           return caches.delete(key); // Return a promise that's fulfilled when each outdated cache is deleted.
         })
      );
    })
    .then(() => {
      log('removeOldCache completed.');
    });
}

function cacheKey() {
  return [version, ...arguments].join(':');
}

function log() {
  if (developmentMode()) {
    console.log("SW:", ...arguments);
  }
}

function shouldAlwaysFetch(request) {
  return __DEVELOPMENT__ ||
    request.method !== 'GET' ||
      ignoreFetch.some(regex => request.url.match(regex));
}

function shouldFetchAndCache(request) {
  return ~request.headers.get('Accept').indexOf('text/html');
}

function developmentMode() {
  return __DEVELOPMENT__ || __DEBUG__;
}

log("Hello from ServiceWorker land!", version);

self.addEventListener('install', onInstall);

self.addEventListener('fetch', onFetch);

self.addEventListener("activate", onActivate);
