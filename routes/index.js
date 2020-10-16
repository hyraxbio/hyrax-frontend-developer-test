var express = require('express');
var router = express.Router();
var countries = require('../countries.json')
/* GET home page. */

router.get('/', function(req, res, next) {
  console.log(req.query);
  res.json(countriesJSON(countries, req.query));
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

function isFilterMatch(item, params) {
  var nameParam = params.name;
  var min_amount = params.min_amount;
  var max_amount = params.max_amount;
  
  var conditions = [];
 
  
  if (nameParam) {
    var nameCondition = item.name.toLowerCase().indexOf(description.toLowerCase()) > -1;
    conditions.push(nameCondition);
  }

  if (min_amount) {
    var min_amountCondition = item.amount >= min_amount;
    conditions.push(min_amountCondition);
  }

  if (max_amount) {
    var max_amountCondition = item.amount <= max_amount;
    conditions.push(max_amountCondition);
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
  var url = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
  var secondPart = `&page[size]=${size}&sort=${sort}`;
  var paginationLinks = {};
  var firstQueryParams = encodeURI(`page[number]=1${secondPart}`);
  var lastQueryParams = encodeURI(`page[number]=${Math.ceil(filteredItemsLength/size)}${secondPart}`);
  var selfQueryParams = encodeURI(`page[number]=${page}${secondPart}`);
  var prevQueryParams = encodeURI(`page[number]=${page - 1}${secondPart}`);
  var nextQueryParams = encodeURI(`page[number]=${page + 1}${secondPart}`);
  paginationLinks.last = `${url}?${lastQueryParams}`;
  paginationLinks.first = `${url}?${firstQueryParams}`;
  paginationLinks.self = `${url}?${selfQueryParams}`;
  if (page > 1) {
    paginationLinks.prev = `${url}?${prevQueryParams}`;
  }
  if (paginationLinks.self !== paginationLinks.last) {
    paginationLinks.next = `${url}?${nextQueryParams}`;
  }
  return paginationLinks;
}

function sortedItems(items, sortProp) {
  if (!sortProp) {
    return items;
  }
  var direction = sortProp.charAt(0) === '-' ? 'desc' : 'asc';
  sortProp = sortProp.charAt(0) === '-' ? sortProp.replace('-', '') : sortProp;
  var dateFields = ['paymentDate'];
  var sortedItems;
  if (direction === 'asc') {
    sortedItems = items.sort(function(a, b){
      if (dateFields.indexOf(sortProp) > -1) {
        return moment(a[sortProp]).toDate() - moment(b[sortProp]).toDate();
      } else {
        return a[sortProp] - b[sortProp];
      }
    });
  } else {
    sortedItems = items.sort(function(a, b){
      if (dateFields.indexOf(sortProp) > -1) {
        return moment(b[sortProp]).toDate() - moment(a[sortProp]).toDate();
      } else {
        return b[sortProp] - a[sortProp];
      }
    });
  }
  return sortedItems;
}

function countriesJSON(data, queryParams) {
  queryParams.include = 'smartTagClones';
  var searchParams = queryParams.filter;
  var size = parseInt(queryParams['page[size]']);
  var filtered = filteredItems(data, searchParams);
  var sorted = sortedItems(filtered, queryParams.sort);
  var sliced = slicedItems(sorted, queryParams['page[number]'], queryParams['page[size]']);
  let json = this.serialize(sliced);
  json.links = paginationLinks(queryParams['page[number]'], queryParams['page[size]'], queryParams.sort, filtered.length);
  var page_size_decrement = size - 10;
  var page_size_increment = size + 10;
  json.meta = {
    total_data_length: payments.length,
    filtered_data_length: filtered.length,
    max_page_size: 100,
    min_page_size: 10,
    page_size: size,
    page_size_decrement: page_size_decrement,
    page_size_increment: page_size_increment,
    page_size_is_max: size === this.max_page_size,
    page_size_is_min: size === this.min_page_size,
    total_pages: Math.ceil(filtered.length/size),
    total_amounts: totalAmounts(filtered.models)
  };
  return json;
}



module.exports = router;
