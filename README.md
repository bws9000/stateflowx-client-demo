## Architecture

```txt
Angular Client
        ↓
@stateflowx/client
        ↓
JSON-RPC over WebSockets
        ↓
@stateflowx/runtime
        ↓
Providers / Services / Workflows
```

## Example Workflow

The current demo executes a weather workflow by:

1. Connecting to the runtime
2. Initializing the runtime configuration
3. Registering providers and services
4. Executing a workflow route
5. Formatting structured JSON output for the frontend

## Technologies

- Angular
- TypeScript
- RxJS
- StateFlowX Client SDK
- JSON-RPC
- WebSockets

## Related Packages

- [@stateflowx/runtime](https://www.npmjs.com/package/@stateflowx/runtime)
- [@stateflowx/client](https://www.npmjs.com/package/@stateflowx/client)
