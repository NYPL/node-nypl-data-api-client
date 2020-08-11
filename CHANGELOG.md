# CHANGELOG

## v1.0.4 - 2020-08-11
 - Dependency updates to address vulnerabilities

## v1.0.3 - 2020-07-17
 - Adds better CLI support for POSTing things

## v1.0.2 - 2020-07-17
 - Deprecated.

## v1.0.1 - 2020-05-06
 - Dependency updates to address vulnerabilities

## v1.0.0 - 2017-11-08

 - Attempt to refresh oauth token if found invalid for authenticated
     calls generally
 - Make test suite offline by default including mocked api and oauth responses
 - Add jsdoc generated usage.md, move usage notes out of README
 - Improved CLI with get command for GETing arbitrary api paths
 - Logs are now prefixed with "[nypl-data-api-client {LEVEL}]: "

### Breaking changes

 - RequestOptions json config param defaults to true for all requests
 - Client returns whole api response without [un]helpfully reaching into data property
 - GET requests no longer cached by default

See [PR](https://github.com/NYPL-discovery/node-nypl-data-api-client/pull/5) for discussion.

## v0.2.4
- Small bug fix to return data from a GET if the endpoint does not wrap the data object in a `data` property.
