import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  createClient,
  defineConfig,
  gemini,
  openai,
  http,
  jsonRpc,
  mockProvider,
  websocket,
} from '@stateflowx/client';

interface WeatherRow {
  city: string;
  temperature: number;
  condition: string;
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss',
})
export class WeatherComponent implements OnInit {

  response = signal<WeatherRow[]>([]);
  responseText = signal('');
  runtimeEvents = signal<unknown[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private readonly config = defineConfig({
    protocol: jsonRpc(),

    //
    // Runtime transport
    //
    // HTTP:
    //   - Request / response
    //
    // WebSocket:
    //   - Request / response
    //   - Realtime runtime events
    //

    // transport: websocket({
    //   url: 'ws://localhost:3001',
    // }),

    store: false, // Disable the default InMemoryStore

    transport: http({
      url: 'http://localhost:3000/rpc',
    }),

    providers: [
      openai({ priority: 1 }),
      gemini({ priority: 2 }),
      mockProvider({ priority: 3 }),
    ],

    services: [
      {
        name: 'weather',
        type: 'http',
        method: 'GET',
        url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7357&longitude=-74.1724&current_weather=true',
      },
    ],

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
            // The runtime host must use:
            // STORE_TYPE=mysql
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
          //   log: true,
          //
          //   output: true,
          // },
        ],
      },
    ],
  });

  private readonly client = createClient(this.config);

  async ngOnInit(): Promise<void> {

    this.client.onRuntimeEvent((event) => {
      console.log('[RUNTIME EVENT]', event);

      this.runtimeEvents.update((events) => [
        ...events,
        event,
      ]);
    });

    this.client.onConnect(() => {
      console.log('[CLIENT] Connected');
    });

    this.client.onDisconnect(() => {
      console.log('[CLIENT] Disconnected');
    });

    await this.client.connect();

    await this.client.precheck(this.config);

    console.log('[CLIENT] Precheck passed');

    await this.client.request(
      'runtime.initialize',
      this.config
    );

    await this.loadWeather();
  }

  private async loadWeather(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const result =
        await this.client.request<string>(
          'weather.execute'
        );

      console.log('[WORKFLOW RESULT]', result);

      const parsed =
        this.parseJsonResponse(result);

      this.response.set(parsed);

      this.responseText.set(
        JSON.stringify(parsed, null, 2)
      );

    } catch (error) {

      console.error('[WORKFLOW ERROR]', error);

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

    } finally {
      this.loading.set(false);
    }
  }

  private parseJsonResponse(response: string): WeatherRow[] {
    const cleaned = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  }
}
