import * as functions from 'firebase-functions'

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true })

  functions.logger.info('cwd', process.cwd())
  functions.logger.info(
    'node_modules',
    require('fs').statSync('node_modules').isSymbolicLink()
      ? 'is symlink'
      : 'is not symlink'
  )
  functions.logger.info('vendor_modules', require('fs').readdirSync('vendor_modules'))
  functions.logger.info(
    'vendor_modules/.pnpm',
    require('fs').readdirSync('vendor_modules/.pnpm')
  )

  response.send('Hello from Firebase!')
})

export const hello = functions.https.onCall((data, context) => {
  return {
    message: `Hello ${data.name ?? 'world'}!`,
  }
})
