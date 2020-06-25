var CACHE_NAME = 'CHOIRLESS';

self.addEventListener('fetch', function(event) {

	event.respondWith(
		caches.open(CACHE_NAME).then(function(cache) {
			return cache.match(event.request)
				.then(function(response) {

					console.log(event.request.url, "Match?", response);

                    var result;

                    if(!response){

                        result = fetchPromise = fetch(event.request)
                            .then(function(networkResponse) {
    
                                if(event.request.method === 'GET'){
    
                                    if(event.request.url.indexOf('.webm') > -1){
                                        console.log('Caching request:', event.request.url);
                                        cache.put(event.request, networkResponse.clone());
                                    }
    
                                }
    
                                return networkResponse;
                            
                            })
                        
                        ;

                    } else {
                        result = response;
                    }

				
				return result;
			
			})
		})
	);
});

self.addEventListener('activate', function(event){

	console.log('Service worker activated');

}, false);