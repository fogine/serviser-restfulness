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
