## FUTURE

* [ADDED] - query `_filter` - allow to use gt,gte,lt,lte keywords for strings
* [ADDED] - query `_filter` - allow to filter by associated many to many (MxM) and one to many (1xM) resources
* [FIXED] - updated lts-alpine nodejs docker image for tests
* [FIXED] - query `_filter` - when when filtering via associated table column value - inner join should not be used because it doesnt allow to select records with no associated resource (where is null condition)
* [FIXED] - if resource property has truthy `nullable` flag, it should not be considered required

## 0.8.5

* [FIXED] - incorrect validation of numbers in `_filter` query param

## 0.8.4

* [FIXED] - exception when trying to generate a link for non-existing get route while creating a new resource

## 0.8.3

* [FIXED] -  bugfix _embed query parameter - allow upper case characters

## 0.8.2

* [FIXED] - postgresql - support null value in `in` query _filter

## 0.8.1

* [FIXED] - adds support for knex@0.21.15

## 0.8.0

* [CHANGED] - make ajv validation keyword whitelists configurable for response & query properties validation schemas. By default query parameter validation whitelist includes `format` keyword.
* [FIXED] - query filter `iLike` keyword was executing incorrect query

## 0.7.0

* [ADDED] - `resource.hasOne()` method to define 1x1 relationship

## 0.6.0

* [ADDED] - `route.reducesDatasetBy(Array<string>)` method
