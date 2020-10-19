var express = require('express');
var router = express.Router();
var countries = require('../countries.json');
/* GET home page. */

// ----------------------------------------------
// SHOW
// ----------------------------------------------

router.get('/countries/:id', function(req, res, next) {
  var country = countries.find(country => {
    return country.id.toString() === req.params.id;
  });
  if (country) {
    res.json({
      data: {
        id: country.id,
        type: 'country',
        attributes: country
      }
    });
  } else {
    res.status(404).json({
      errors: [{
        code: 'item not found',
        detail: `A country with ID ${req.params.id} was not found`,
        status: 404
      }]
    });
  }
});

// ----------------------------------------------
// INDEX
// ----------------------------------------------

router.get('/countries', function(req, res, next) {
  res.json(countriesIndex(countries, req.query));
});

function slicedItems(items, page, size) {
  var maxPageNumber = Math.ceil(items.length/size);
  var pageNumber = parseInt(page || 1);
  if (pageNumber > maxPageNumber) {
    pageNumber = maxPageNumber;
  }
  var pageSize = parseInt(size);
  var firstResult = pageSize * (pageNumber - 1);
  var lastResult = pageSize * pageNumber;
  return items.slice(firstResult,lastResult);
}

function filteredItems(payments, searchParams) {
  var filteredItems = payments.filter(item => {
    return isFilterMatch(item, searchParams);
  });
  return filteredItems;
}

function isFilterMatch(item, params = {}) {
  var nameParam = params.name;
  var minPop = params.min_population;
  var maxPop = params.max_population;
  
  var conditions = [];
  
  if (nameParam) {
    var nameCondition = item.name.toLowerCase().indexOf(nameParam.toLowerCase()) > -1;
    conditions.push(nameCondition);
  }

  if (minPop) {
    var minPopCondition = item.population >= minPop;
    conditions.push(minPopCondition);
  }

  if (maxPop) {
    var maxPopCondition = item.population <= maxPop;
    conditions.push(maxPopCondition);
  }
  return conditions.every(function(condition) {
    return condition === true;
  });
}

function paginationLinks(page, size, sort, filteredItemsLength) {
  size=parseInt(size);
  page=parseInt(page || 1);
  var maxPageNumber = Math.ceil(filteredItemsLength/size);
  if (page > maxPageNumber) {
    page = maxPageNumber;
  }
  var secondPart = `&page[size]=${size}&sort=${sort}`;
  var paginationLinks = {};
  var firstQueryParams = encodeURI(`page[number]=1${secondPart}`);
  var lastQueryParams = encodeURI(`page[number]=${Math.ceil(filteredItemsLength/size)}${secondPart}`);
  var selfQueryParams = encodeURI(`page[number]=${page}${secondPart}`);
  var prevQueryParams = encodeURI(`page[number]=${page - 1}${secondPart}`);
  var nextQueryParams = encodeURI(`page[number]=${page + 1}${secondPart}`);
  paginationLinks.last = `/countries?${lastQueryParams}`;
  paginationLinks.first = `/countries?${firstQueryParams}`;
  paginationLinks.self = `/countries?${selfQueryParams}`;
  if (page > 1) {
    paginationLinks.prev = `/countries?${prevQueryParams}`;
  }
  if (paginationLinks.self !== paginationLinks.last) {
    paginationLinks.next = `/countries?${nextQueryParams}`;
  }
  return paginationLinks;
}

function sortedItems(items, sortProp) {
  if (!sortProp) {
    return items;
  }
  var direction = sortProp.charAt(0) === '-' ? 'desc' : 'asc';
  sortProp = sortProp.charAt(0) === '-' ? sortProp.replace('-', '') : sortProp;
  var sortedItems;
  if (direction === 'asc') {
    if (sortProp === 'name') {
      sortedItems = items.sort();
    } else {
      sortedItems = items.sort(function(a, b){
        return a[sortProp] - b[sortProp];
      });
    }
    
  } else {
    if (sortProp === 'name') {
      sortedItems = items.reverse();
    } else {
      sortedItems = items.sort(function(a, b){
        return b[sortProp] - a[sortProp];
      });
    }
  }
  return sortedItems;
}

function countriesIndex(data, queryParams) {
  var max_page_size = 100;
  var min_page_size = 10;

  var searchParams = queryParams.filter;
  var size = parseInt(queryParams.page.size);
  var filtered = filteredItems(data, searchParams);
  var sorted = sortedItems(filtered, queryParams.sort);
  var sliced = slicedItems(sorted, queryParams.page.number, queryParams.page.size);
  var serialised = sliced.map(country => {
    return {
      id: country.id,
      type: 'country',
      attributes: {
        name: country.name,
        code: country.code,
        region: country.region,
        population: country.population
      }
    };
  });
  var links = paginationLinks(queryParams.page.number, queryParams.page.size, queryParams.sort, filtered.length);
  var page_size_decrement = size - 10;
  var page_size_increment = size + 10;
  var meta = {
    total_data_length: data.length,
    filtered_data_length: filtered.length,
    max_page_size: max_page_size,
    min_page_size: min_page_size,
    page_size: size,
    page_size_decrement: page_size_decrement,
    page_size_increment: page_size_increment,
    page_size_is_max: size === max_page_size,
    page_size_is_min: size === min_page_size,
    total_pages: Math.ceil(filtered.length/size),
  };

  return {
    data: serialised,
    links: links,
    meta: meta
  };
}



module.exports = router;
