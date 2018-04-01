import xs from 'xstream';
import io from 'socket.io-client';

export function makeSocketDriver() {
  const socket = io();

  return (emit$) => {
    emit$.subscribe({
      next: ([event, payload]) => socket.emit(event, payload),
    });

    return {
      event: (name) => {
        const socketProducer = {
          start: (listener) => {
            socket.on(name, (e) => {
              listener.next(e);
            });
          },

          stop: () => {
            console.log('stop');
          },
        };

        return xs.create(socketProducer);
      },
    };
  }
}

export default makeSocketDriver;
