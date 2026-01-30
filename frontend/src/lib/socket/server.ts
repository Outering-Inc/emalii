/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from 'socket.io'

declare global {
   
  var io: Server | undefined
}

export function getSocketServer(server?: any) {
  if (!global.io && server) {
    global.io = new Server(server, {
      path: '/api/socket',
      cors: {
        origin: '*',
      },
    })
  }

  return global.io
}