function route(originKey) {
  
  const routes = {
    origin: {
      sts: 'https://script.google.com/macros/s/AKfycbzJ2v5KJsqNvi8WJioHWs9lOUAtxZBJlUq9Od7lxl1O9mpE-WirC1A8jzBRTX5kQpqQ/exec'
    }
  };
  
  return routes.origin[originKey];
}

var User = (function() {
	
	function getDora() {
		return 10;
	}
	
	function getVuchka() {
		return 12;
	}
	
	return {
		getDora: getDora,
		getVuchka: getVuchka
	};
})();
