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

  submit(): void {
    if (!this.prompt().trim()) {
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      this.response.set(`stateflowx response: ${this.prompt()}`);

      this.loading.set(false);
    }, 500);
  }
}
