# StateFlowX Angular Client Demo

Angular example application demonstrating client-configured execution flows with StateFlowX.

This demo uses `@stateflowx/client` to configure providers, services, and flows directly from an Angular application and sends that configuration to a separately hosted StateFlowX Runtime.

The runtime dynamically executes the configured flow. The weather orchestration is not hardwired into the runtime.

---

## Features

- Angular standalone application
- StateFlowX Client SDK integration
- Client-defined runtime configuration
- Configurable execution flows
- Action-based flow execution
- Action connectors
- HTTP service actions
- AI provider actions
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
   ┌────┴────┐
   │         │
Services  Providers
   │         │
   └────┬────┘
        │
        ▼
   Flow Output
        │
        ▼
Angular Application
```

The Angular application defines **what should execute**.

The StateFlowX Runtime determines **how the configured flow is executed**.

---

## Weather Flow Example

The demo registers a weather HTTP service:

```ts
services: [
  {
    name: 'weather',
    type: 'http',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7357&longitude=-74.1724&current_weather=true',
  },
],
```

It then defines a configurable flow containing two actions:

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
            actionId: 'weather-provider',
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
      },
    ],
  },
],
```

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

The provider action references the result directly inside its prompt:

```text
{{weather-service}}
```

StateFlowX resolves the connected action result before executing the provider.

Finally:

```ts
output: true
```

marks the provider action result as the result returned by the flow.

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

This allows provider selection to be controlled by the flow configuration rather than hardcoded into the runtime.

---

## Runtime Initialization

The client connects to the runtime, performs a provider precheck, and sends its configuration:

```ts
await this.client.connect();

await this.client.precheck(this.config);

await this.client.request(
  'runtime.initialize',
  this.config
);
```

The runtime dynamically registers the configured services and flows.

The Angular application can then execute the flow by route:

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
    // configurable actions
  ]
}
```

Each action has an `id` and a `type`.

Actions can connect their output to other actions:

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

Connected action results can then be referenced by ID:

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

This allows the execution sequence, data connections, provider selection, prompts, and final output to be described by client configuration rather than hardcoded orchestration logic.

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

---

## Related Packages

- [@stateflowx/runtime](https://www.npmjs.com/package/@stateflowx/runtime)
- [@stateflowx/client](https://www.npmjs.com/package/@stateflowx/client)

---

## Status

StateFlowX is experimental and under active development.

This Angular demo demonstrates the configurable StateFlowX Flow model, where application-defined actions, connectors, providers, services, prompts, and outputs are sent to the runtime and dynamically orchestrated at execution time.
