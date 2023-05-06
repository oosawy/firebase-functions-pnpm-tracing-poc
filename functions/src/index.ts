import * as functions from 'firebase-functions'

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true })
  response.send('Hello from Firebase!')
})

export const hello = functions.https.onCall((data, context) => {
  return {
    message: `Hello ${data.name ?? 'world'}!`,
  }
})
