import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  readonly prompt = signal('');

  readonly response = signal('');

  readonly loading = signal(false);

  private socket = new WebSocket('ws://localhost:3000');

  handleMessage(event: MessageEvent): void {
    const response = JSON.parse(event.data);

    this.response.set(JSON.stringify(response.result, null, 2));

    this.loading.set(false);
  }

  submit(): void {
    if (!this.prompt().trim()) {
      return;
    }

    this.loading.set(true);

    const payload = {
      jsonrpc: '2.0',
      method: 'ping',
      id: 1,
    };

    this.socket.send(JSON.stringify(payload));

    this.socket.onmessage = (event) => {
      const response = JSON.parse(event.data);

      this.response.set(JSON.stringify(response.result, null, 2));

      this.loading.set(false);
    };
  }
}
