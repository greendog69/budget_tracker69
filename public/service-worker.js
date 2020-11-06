//console.log("I am inside the service worker file"); 

//Here are the files to be cached by our service worker
const FILES_TO_CACHE = [
    "/", 
    "/index.html",
    "/index.js", 
    "/db.js", 
    "/styles.css"
];

//we created a cacheName variable to store unique name for Cache object
const CACHE_NAME = "static-cache-v1";

//we created a data cacheName variable to store unique name for Cache data
const DATA_CACHE_NAME = "data-cache-v1";

// attach event listener to window (self) whenever service worker is installed
self.addEventListener("install", function(e) {
    //Wait until cache is open
    e.waitUntil(
        // pre-cache all files to be cached
        caches.open(CACHE_NAME).then(cache => {
            console.log("Files were cached after install");
            // complete pre- cache and return cahed files
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // ensures that any new versions of a service worker will take over the page and become activated immediately.
    self.skipWaiting();
});

// attach event listener to window (self) whenever service worker is installed
self.addEventListener("activate", function(e) {
  // wait until we get the keys from the cache  
  e.waitUntil(
    // get the list of keys
    caches.keys().then(keyList => {
        // return keys as promise
        return Promise.all(
            // map over each key in keylist
            keyList.map(key => {
                // check if existing keys are valid
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log("Remove old cache keys", key);
                    // remove old keys
                    return caches.delete(key);
                }
            })
        );
    })
  );
  //Every time the page loads it checks for an updated version of service-worker.js
  self.clients.claim();
});

//attach event listener to window (self) whenever service worker calls fetch.
self.addEventListener("fetch", function(e){
    console.log('e',e)
    //checks if the fetch URL contains the string '/api', this reps the network call to be cached
    if(e.request.url.includes("/api")){
        // print out the request URL
        console.log("[Service Worker] Fetch (data)", e.request.url);

        //What the service will respond with
        e.respondWith(
            //opens the data cache by key name
            caches.open(DATA_CACHE_NAME).then(cache => {
                //start fetch with events request 
                return fetch(e.request)
                .then(response => {
                    //ensure response from network is good
                    if(response.status === 200){
                        //Copy the response of our fetch into our cache and save the request URL
                        cache.put(e.request.url, response.clone());
                    }

                    //end the fetch and return response.
                    return response;
                })
                .catch(err => {
                    //if offline return data from cache
                    return cache.match(e.request);
                })
            })
        );

        return;
    }

    // if url is not a network request, does not contain API
    e.respondWith(
        //opens the data cache by key name
        caches.open(CACHE_NAME).then(cache => {
            // return offline cache
            return cache.match(e.request).then(response => {
                //return response or make a fetch call
                return response || fetch(e.request);
            })
        })
    )
})
