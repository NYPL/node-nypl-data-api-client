## Classes

<dl>
<dt><a href="#Client">Client</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ClientConstructorOptions">ClientConstructorOptions</a> : <code>Object</code></dt>
<dd><p>Note that <code>oauth_url</code> is expected to be a <em>base</em> URL, from which authorization &amp; token endpoints are derived internally. As such, the <code>oauth_url</code> should end in &quot;.org/&quot; in most cases.</p>
</dd>
<dt><a href="#RequestOptions">RequestOptions</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Client"></a>

## Client
**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * [.get(path, options)](#Client+get) ⇒ <code>Promise</code>
    * [.post(path, body, options)](#Client+post) ⇒ <code>Promise</code>
    * [.patch(path, body, options)](#Client+patch) ⇒ <code>Promise</code>
    * [.dangerouslyCallDelete(path, body, options)](#Client+dangerouslyCallDelete) ⇒ <code>Promise</code>

<a name="new_Client_new"></a>

### new Client(options)

| Param | Type | Description |
| --- | --- | --- |
| options | [<code>ClientConstructorOptions</code>](#ClientConstructorOptions) | A hash of options |

<a name="Client+get"></a>

### client.get(path, options) ⇒ <code>Promise</code>
GET an api path

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <code>Promise</code> - A promise that resolves the fetched data  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to fetch (e.g. 'current-schema/Item') |
| options | [<code>RequestOptions</code>](#RequestOptions) | A hash of options. |

<a name="Client+post"></a>

### client.post(path, body, options) ⇒ <code>Promise</code>
POST an object to an api endpoint

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <code>Promise</code> - A promise that resolves the result data  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to fetch (e.g. 'current-schema/Item') |
| body | <code>Object</code> | The object/string to pass with the request |
| options | [<code>RequestOptions</code>](#RequestOptions) | A hash of options. |

<a name="Client+patch"></a>

### client.patch(path, body, options) ⇒ <code>Promise</code>
PATCH a resource at an api endpoint

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <code>Promise</code> - A promise that resolves the result data  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to fetch (e.g. 'current-schema/Item') |
| body | <code>Object</code> | The partial object to pass with the request |
| options | [<code>RequestOptions</code>](#RequestOptions) | A hash of options. |

<a name="Client+dangerouslyCallDelete"></a>

### client.dangerouslyCallDelete(path, body, options) ⇒ <code>Promise</code>
DELETE an object from an api endpoint

**Kind**: instance method of [<code>Client</code>](#Client)  
**Returns**: <code>Promise</code> - A promise that resolves the result data  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to fetch (e.g. 'current-schema/Item') |
| body | <code>Object</code> | The object/string to pass with the request |
| options | [<code>RequestOptions</code>](#RequestOptions) | A hash of options. |

<a name="ClientConstructorOptions"></a>

## ClientConstructorOptions : <code>Object</code>
Note that `oauth_url` is expected to be a *base* URL, from which authorization & token endpoints are derived internally. As such, the `oauth_url` should end in ".org/" in most cases.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| base_url | <code>string</code> | Base URL for API (e.g. 'https://[FQDN]/api/v0.1/').    If missing, client will check process.env.NYPL_API_BASE_URL |
| oauth_key | <code>string</code> | OAUTH key. (If missing, client will use    process.env.NYPL_OAUTH_KEY) |
| oauth_secret | <code>string</code> | OAUTH secret. (If missing, client will use    process.env.NYPL_OAUTH_SECRET) |
| oauth_url | <code>string</code> | OAUTH base URL. This is used to build token    endpoints. Normally, should end in ".org/" (If missing, client will use    process.env.NYPL_OAUTH_URL) |
| log_level | <code>string</code> | Set [log level](https://github.com/pimterry/loglevel)    (i.e. info, error, warn, debug). Default env.LOG_LEVEL or 'error' |

<a name="RequestOptions"></a>

## RequestOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| authenticate | <code>boolean</code> | Whether or not to authenticate before performing request. Default `true` |
| json | <code>boolean</code> | Indicates endpoint serves and consumes json.    If set to true, `request` will add header "Content-type: application/json"    as well as automatically parse response as json. |
| cache | <code>boolean</code> | Whether or not to cache the result. Only allowed for GET requests. Default `false` |
| headers | <code>Object</code> | Hash of headers to pass in the request. Default {}. |
| token_expiration_retries | <code>integer</code> | Number of refresh attempts to make if token expired. Default 1 |

