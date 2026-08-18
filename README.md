# StateFlowX Angular Client Demo

Angular example application demonstrating client-configured execution flows with StateFlowX.

This demo uses `@stateflowx/client` to configure providers, services, actions, connectors, and flows directly from an Angular application. The configuration is sent to a separately hosted StateFlowX Runtime.

The runtime dynamically executes the configured flow. The weather orchestration is not hardwired into the runtime.

---

## Features

- Angular standalone application
- StateFlowX Client SDK integration
- Client-defined runtime configuration
- Configurable execution flows
- Action-based flow execution
- Connector-driven action composition
- HTTP service actions
- AI provider actions
- Optional persistent store actions
- Optional MySQL-backed flow state
- Provider priority and explicit provider selection
- Structured flow output
- HTTP JSON-RPC transport
- Optional WebSocket transport
- Realtime runtime events over WebSockets
- Runtime precheck and initialization

---

## Architecture

```text
Angular Application
        │
        │ defineConfig()
        ▼
@stateflowx/client
        │
        │ runtime.initialize
        ▼
HTTP / WebSocket JSON-RPC
        │
        ▼
@stateflowx/runtime
        │
        ▼
   Flow Orchestrator
        │
        ▼
      Actions
        │
   ┌────┼─────┐
   │    │     │
Service AI   Store
   │    │     │
   └────┼─────┘
        │
        ▼
   Flow Output
        │
        ▼
Angular Application
```

The Angular application defines **what should execute**.

The StateFlowX Runtime determines **how the configured flow is executed**.

Database connections and credentials are configured by the runtime host, not the Angular client.

---

## Weather Flow Example

The demo registers a weather HTTP service:

```ts
services: [
  {
    name: 'weather',

    type: 'http',

    method: 'GET',

    url:
      'https://api.open-meteo.com/v1/forecast?latitude=40.7357&longitude=-74.1724&current_weather=true',
  },
],
```

It then defines a configurable flow containing a service action and provider action:

```ts
flows: [
  {
    name: 'Weather Analysis',

    route: 'weather.execute',

    actions: [
      {
        id: 'weather-service',

        type: 'service',

        service: 'weather',

        outputConnectors: [
          {
            actionId:
              'weather-provider',
          },
        ],
      },
      {
        id: 'weather-provider',

        type: 'provider',

        provider: 'gemini',

        prompt: `
          Return ONLY valid JSON.

          Return exactly one array item.

          Schema:

          [
            {
              "city": string,
              "temperature": number,
              "condition": string
            }
          ]

          Use the supplied weather data from {{weather-service}}
        `,

        output: true,

        //
        // Optional MySQL persistence
        //
        // Uncomment this connector and the
        // weather-store action below.
        //
        // outputConnectors: [
        //   {
        //     actionId:
        //       'weather-store',
        //   },
        // ],
      },

      //
      // Optional MySQL store action
      //
      // {
      //   id: 'weather-store',
      //
      //   type: 'store',
      //
      //   store: 'mysql',
      //
      //   operation: 'set',
      //
      //   key: 'weather:last-result',
      //
      //   output: true,
      // },
    ],
  },
],
```

The MySQL action is included as a commented example so the Angular demo runs without requiring a database.

---

## How the Flow Works

```text
weather.execute
      │
      ▼
weather-service
      │
      │ HTTP weather data
      ▼
outputConnector
      │
      ▼
weather-provider
      │
      │ {{weather-service}}
      ▼
Gemini
      │
      ▼
Structured JSON
      │
      │ output: true
      ▼
Flow Result
```

The `weather-service` action executes the registered HTTP service.

Its output is connected to `weather-provider`:

```ts
outputConnectors: [
  {
    actionId: 'weather-provider',
  },
],
```

The provider action references the connected result inside its prompt:

```text
{{weather-service}}
```

StateFlowX resolves the connected action result before executing the provider.

Finally:

```ts
output: true
```

marks the provider result as the value returned by the flow.

---

## Optional MySQL Persistence

The provider result can optionally be persisted by connecting it to a store action.

Add this connector to `weather-provider`:

```ts
outputConnectors: [
  {
    actionId: 'weather-store',
  },
],
```

Then add the store action:

```ts
{
  id: 'weather-store',

  type: 'store',

  store: 'mysql',

  operation: 'set',

  key: 'weather:last-result',

  output: true,
}
```

The resulting flow becomes:

```text
Weather service
      ↓
Gemini provider
      ↓
MySQL store
      ↓
Flow result
```

The runtime host must be configured to use MySQL:

```env
STORE_TYPE=mysql

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=stateflowx
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_TABLE=stateflowx_store
```

The Angular application declares the store action, but it does not receive or manage database credentials.

---

## Action Composition

StateFlowX actions pass results through connectors.

Supported action types currently include:

- `service`
- `provider`
- `store`

Actions can be composed in different sequences:

```text
Service → Provider
Service → Provider → Store
Store → Service
Service → Store → Service
Provider → Store → Service
```

A service can consume a connected action result:

```ts
{
  id: 'stored-result',

  type: 'store',

  store: 'mysql',

  operation: 'get',

  key: 'weather:last-result',

  outputConnectors: [
    {
      actionId: 'consumer-service',
    },
  ],
},
{
  id: 'consumer-service',

  type: 'service',

  service: 'weather-consumer',

  output: true,
}
```

This allows service inputs, provider prompts, stored values, and final outputs to be configured without hardwired orchestration logic.

---

## Provider Configuration

The demo registers multiple AI providers with priorities:

```ts
providers: [
  openai({ priority: 1 }),

  gemini({ priority: 2 }),

  mockProvider({ priority: 3 }),
],
```

Individual flow actions can explicitly select a provider:

```ts
{
  id: 'weather-provider',

  type: 'provider',

  provider: 'gemini',
}
```

This allows provider selection to be controlled by flow configuration rather than hardcoded into the runtime.

---

## Runtime Initialization

The client connects to the runtime, performs a provider precheck, and sends its configuration:

```ts
await this.client.connect();

await this.client.precheck(
  this.config
);

await this.client.request(
  'runtime.initialize',
  this.config
);
```

The runtime dynamically registers the configured services and flows.

The Angular application can then execute a flow by route:

```ts
const result =
  await this.client.request<string>(
    'weather.execute'
  );
```

The Angular component does not need to know how the flow is executed internally.

---

## Transport

The demo currently uses HTTP JSON-RPC:

```ts
transport: http({
  url: 'http://localhost:3000/rpc',
}),
```

WebSocket transport can also be used:

```ts
transport: websocket({
  url: 'ws://localhost:3001',
}),
```

WebSocket transport additionally supports realtime runtime events.

---

## Flow Configuration

A StateFlowX flow is defined by a route and a collection of actions:

```ts
{
  name: 'Weather Analysis',

  route: 'weather.execute',

  actions: [
    // Configurable actions
  ]
}
```

Each action has an `id` and a `type`.

Actions connect their output to other actions:

```ts
{
  id: 'weather-service',

  type: 'service',

  outputConnectors: [
    {
      actionId: 'weather-provider',
    },
  ],
}
```

Connected provider results can be referenced by action ID:

```text
{{weather-service}}
```

An action can be designated as the flow output:

```ts
{
  id: 'weather-provider',

  type: 'provider',

  output: true,
}
```

This allows the execution sequence, data connections, provider selection, prompts, state persistence, and final output to be described through client configuration.

---

## Technologies

- Angular
- TypeScript
- Angular Signals
- StateFlowX Client SDK
- StateFlowX Runtime
- JSON-RPC
- HTTP
- WebSockets
- Gemini
- OpenAI
- MySQL

---

## Related Packages

- [@stateflowx/runtime](https://www.npmjs.com/package/@stateflowx/runtime)
- [@stateflowx/client](https://www.npmjs.com/package/@stateflowx/client)
- [@stateflowx/common](https://www.npmjs.com/package/@stateflowx/common)

---

## Status

StateFlowX is experimental and under active development.

This Angular demo demonstrates the configurable StateFlowX flow model, where application-defined actions, connectors, providers, services, prompts, optional persistent state, and outputs are sent to the runtime and dynamically orchestrated at execution time.
