import { describe, expect, it } from '@jest/globals';

describe('ChatComponent', () => {
  it('should persist counter across runtime calls', (done) => {
    const socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'ping',
          id: 1,
        }),
      );
    };

    let stage = 0;

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);

      if (stage === 0) {
        expect(response.result.counter).toBe(0);

        stage++;

        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'increment',
            id: 2,
          }),
        );

        return;
      }

      if (stage === 1) {
        expect(response.result.counter).toBe(1);

        stage++;

        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'ping',
            id: 3,
          }),
        );

        return;
      }

      if (stage === 2) {
        expect(response.result.counter).toBe(1);

        socket.close();

        done();
      }
    };
  });
});
