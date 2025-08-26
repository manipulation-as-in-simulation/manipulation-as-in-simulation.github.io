function getSearchTermFromLocation() {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == 'q') {
      return decodeURIComponent(sParameterName[1].replace(/\+/g, '%20'));
    }
  }
}

function joinUrl (base, path) {
  if (path.substring(0, 1) === "/") {
    // path starts with `/`. Thus it is absolute.
    return path;
  }
  if (base.substring(base.length-1) === "/") {
    // base ends with `/`
    return base + path;
  }
  return base + "/" + path;
}

function escapeHtml (value) {
  return value.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatResult (location, title, summary) {
  return '<article><h3><a href="' + joinUrl(base_url, location) + '">'+ escapeHtml(title) + '</a></h3><p>' + escapeHtml(summary) +'</p></article>';
}

function displayResults (results) {
  var search_results = document.getElementById("mkdocs-search-results");
  var book_search_results = document.getElementById("book-search-results");
  
  // Clear previous results
  var results_list = book_search_results.querySelector('.search-results-list');
  if (results_list) {
    while (results_list.firstChild) {
      results_list.removeChild(results_list.firstChild);
    }
  }
  
  // Update search query display
  var query_elements = book_search_results.querySelectorAll('.search-query');
  var search_input = document.querySelector('#book-search-input input') || document.getElementById('mkdocs-search-query');
  if (query_elements && search_input) {
    for (var j = 0; j < query_elements.length; j++) {
      query_elements[j].textContent = search_input.value;
    }
  }
  
  if (results.length > 0){
    // Show results
    book_search_results.classList.add('active');
    
    // Update result count
    var count_element = book_search_results.querySelector('.search-results-count');
    if (count_element) {
      count_element.textContent = results.length;
    }
    
    // Show has-results, hide no-results
    var has_results = book_search_results.querySelector('.has-results');
    var no_results = book_search_results.querySelector('.no-results');
    if (has_results) has_results.style.display = 'block';
    if (no_results) no_results.style.display = 'none';
    
    // Add results to list
    if (results_list) {
      for (var i=0; i < results.length; i++){
        var result = results[i];
        var li = document.createElement('li');
        li.className = 'search-results-item';
        li.innerHTML = formatResult(result.location, result.title, result.summary);
        results_list.appendChild(li);
      }
    }
  } else {
    // Show no results
    book_search_results.classList.add('active');
    
    // Show no-results, hide has-results
    var has_results = book_search_results.querySelector('.has-results');
    var no_results = book_search_results.querySelector('.no-results');
    if (has_results) has_results.style.display = 'none';
    if (no_results) no_results.style.display = 'block';
  }
}

function doSearch () {
  var search_input = document.querySelector('#book-search-input input') || document.getElementById('mkdocs-search-query');
  var book_search_results = document.getElementById("book-search-results");
  
  if (!search_input) return;
  
  var query = search_input.value;
  
  if (query.length > min_search_length) {
    if (!window.Worker) {
      displayResults(search(query));
    } else {
      searchWorker.postMessage({query: query});
    }
  } else {
    // Clear results and hide search results for short queries
    if (book_search_results) {
      book_search_results.classList.remove('active');
    }
    displayResults([]);
  }
}

function initSearch () {
  var search_input = document.querySelector('#book-search-input input') || document.getElementById('mkdocs-search-query');
  if (search_input) {
    search_input.addEventListener("keyup", doSearch);
  }
  var term = getSearchTermFromLocation();
  if (term && search_input) {
    search_input.value = term;
    doSearch();
  }
}

function onWorkerMessage (e) {
  if (e.data.allowSearch) {
    initSearch();
  } else if (e.data.results) {
    var results = e.data.results;
    displayResults(results);
  } else if (e.data.config) {
    min_search_length = e.data.config.min_search_length-1;
  }
}

if (!window.Worker) {
  console.log('Web Worker API not supported');
  // load index in main thread
  $.getScript(joinUrl(base_url, "search/worker.js")).done(function () {
    console.log('Loaded worker');
    init();
    window.postMessage = function (msg) {
      onWorkerMessage({data: msg});
    };
  }).fail(function (jqxhr, settings, exception) {
    console.error('Could not load worker.js');
  });
} else {
  // Wrap search in a web worker
  var searchWorker = new Worker(joinUrl(base_url, "search/worker.js"));
  searchWorker.postMessage({init: true});
  searchWorker.onmessage = onWorkerMessage;
}
