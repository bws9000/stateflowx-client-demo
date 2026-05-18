import { CommonModule } from '@angular/common';

import { Component, OnInit, signal } from '@angular/core';

import {
  createClient,
  defineConfig,
  gemini,
  jsonRpc,
  mockProvider,
  websocket,
} from '@stateflowx/client';

@Component({
  selector: 'app-weather',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './weather.component.html',

  styleUrl: './weather.component.scss',
})
export class WeatherComponent implements OnInit {
  response = signal<unknown[]>([]);

  responseText = signal('');

  private config = defineConfig({
    protocol: jsonRpc(),

    transport: websocket({
      url: 'ws://localhost:3000',
    }),

    providers: [
      gemini({
        priority: 1,
      }),

      mockProvider({
        priority: 2,
      }),
    ],

    services: [
      {
        name: 'weather',

        type: 'http',

        method: 'GET',

        url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7357&longitude=-74.1724&current_weather=true',
      },
    ],

    workflows: [
      {
        route: 'weather.execute',

        service: 'weather',

        provider: 'default',

        prompt: `
        Return ONLY valid JSON.

        Format this weather data into an array structure suitable for AG-Grid.

        Example:
        [
          {
            "city": "Newark",
            "temperature": 72,
            "condition": "Rain"
          }
        ]
        `,
      },
    ],
  });

  private client = createClient(this.config);

  async ngOnInit() {
    await this.client.connect();

    // Initialize the runtime with the configuration
    await this.client.request('runtime.initialize', this.config);

    // Execute the workflow to get weather data
    const result = await this.client.request<string>('weather.execute');

    const cleaned = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    this.response.set(parsed);

    this.responseText.set(JSON.stringify(parsed, null, 2));

    console.log('PARSED WEATHER RESPONSE:', parsed);
  }
}
