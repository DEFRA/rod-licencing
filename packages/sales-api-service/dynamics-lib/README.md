# Rod Licensing - Dynamics Lib

The dynamics-lib package provides the interface to integrate with Microsoft Dynamics and defines the entity model to be
shared by the different packages which comprise the Rod Licensing digital service.

# Environment variables

| name                     | description                                                      | required | default  | valid                         | notes                                                                                                         |
| ------------------------ | ---------------------------------------------------------------- | :------: | -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| NODE_ENV                 | Node environment                                                 |    no    |          | development, test, production |                                                                                                               |
| REDIS_HOST               | Hostname of the redis instance used to cache reference data      |    no    |          |                               | If undefined, local memory will be used for caching                                                           |
| REDIS_PORT               | Port number of the redis instance used to cache reference data   |    no    | 6379     |                               |                                                                                                               |
| REDIS_PASSWORD           | Password used to authenticate with the configured redis instance |    no    |          |                               | If undefined, authentication will not be attempted                                                            |
| OAUTH_CLIENT_ID          | OAuth 2.0 client ID for client credentials flow                  |   yes    | 4000     |                               |                                                                                                               |
| OAUTH_CLIENT_SECRET      | OAuth 2.0 client secret for client credentials flow              |   yes    |          |                               |                                                                                                               |
| OAUTH_AUTHORITY_HOST_URL | OAuth 2.0 authority host                                         |   yes    |          |                               |                                                                                                               |
| OAUTH_TENANT             | OAuth 2.0 tenant                                                 |   yes    |          |                               |                                                                                                               |
| OAUTH_SCOPE              | OAuth 2.0 scope to request (client credentials resource)         |   yes    |          |                               |                                                                                                               |
| DYNAMICS_API_PATH        | Full URL to the dynamics API                                     |   yes    |          |                               | The full URL to the dynamics web api. e.g. https://dynamics-server/api/data/v9.1/                             |
| DYNAMICS_API_VERSION     | The version of the Dynamics API                                  |   yes    |          |                               | The version of the dynamics web api. e.g. 9.1                                                                 |
| DYNAMICS_API_TIMEOUT     | The Dynamics API request timeout                                 |    no    | 90000    |                               | The time in milliseconds after which requests will timeout if Dynamics does not return a response, e.g. 90000 |
| DYNAMICS_CACHE_TTL       | Default TTL for cached operations                                |    no    | 12 hours |                               | The default TTL for cached operations. Specified in seconds.                                                  |

# Prerequisites

See main project [project](../../README.md) documentation.
