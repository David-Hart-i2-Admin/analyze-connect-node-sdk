# i2 Connect SDK sample projects

This directory contains source code, configuration files, and data for two sample connectors that use an i2 Connect server to communicate with the i2 Connect gateway.

## Example connector

The `example-connector` provides ten services:

- **Example Search** demonstrates how to specify a form that users can interact with.
- **Example Seeded Search 1 ('find like this')** demonstrates how to find records that are similar to a set of Person seed records.
- **Example Seeded Search 2 ('expand')** demonstrates how to expand a set of Person seed records to find connections to other records.
- **Example Seeded Search 3 ('edit property values')** demonstrates how to update property values of the seed records provided to the search.
- **Async Example Search** demonstrates how to create an asynchronous query that can report progress back to the user through the use of substatus messages.
- **API Key Authenticated Search** demonstrates how to request an API key from a user in order to run the service.
- **Search Within a Data Source** demonstrates how to change the behavior of a service based on data in the request.
- **Search for Stations Within an Area** demonstrates how to use the `geospatialArea` logical type in a service.
- **Example Search with Custom Source Identifiers** is similar to **Example search**, but also demonstrates how to use source identifiers.
- **Example Seeded Search 2 ('expand') with Custom Source Identifiers** is similar to **Example Seeded Search 2 ('expand')**, but also demonstrates how to use source identifiers.

## NYPD connector

The `nypd-connector` makes requests to the Socrata [NYC Open Data API](https://dev.socrata.com/foundry/data.cityofnewyork.us/d6zx-ckhd).

> **Note:** The API throttles requests by IP address. To raise the throttling limits, you must acquire an app token. For more information, see [Create a Socrata app token](https://i2group.github.io/analyze-connect/content/walkthrough/5-connect-to-eds.html#create-a-socrata-app-token).
>
> When you have an app token, you can specify its value in `nypd-connector/connector.controller.ts`.

The connector provides five services:

- **NYPD Connector: Get all** demonstrates how to retrieve records of all types, subject to a numeric limit.
- **NYPD Connector: Search** demonstrates how to search for Complaint records that can be filtered by a number of conditions.
- **NYPD Connector: Find like this complaint** demonstrates how to search for similar records to a set of Complaint seed records.
- **NYPD Connector: Expand** demonstrates how to expand a set of seed records.
- **NYPD Connector: Expand with conditions** demonstrates how to expand a set of seed records, and allows conditions to be applied to the operation.

## Prerequisites

The i2 Connect server depends on version 14 (or above) of the Node.js run-time environment. If you need to, you can download and install Node.js from the [project website](https://nodejs.org/en/download/).

## Running the example connectors

To start the i2 Connect server and both connectors:

1. At a command prompt, navigate to the `samples` directory.
1. Install the dependencies by running `npm install`.
1. Start the development server by running `npm start`.

To access the configuration for the connectors:

- In a browser, navigate to `http://localhost:3000/ExampleConnector/config` or `http://localhost:3000/NYPDConnector/config` respectively.

### Changing the port

By default, the i2 Connect server starts on `localhost` and uses port 3000. To change these settings, edit the `config/default.json` file and restart the server.
