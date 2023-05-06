#!/usr/bin/env node

const fs = require('fs/promises')
const { nodeFileTrace } = require('@vercel/nft')
const path = require('path')

const copySymlink = async (src, dest, opts) => {
  return fs.cp(src, dest, {
    ...opts,
    dereference: false,
    verbatimSymlinks: true,
  })
}

const main = async (filenames) => {
  const LIB_DIR = path.join(__dirname, '../lib')
  const DIST_DIR = path.join(__dirname, '../dist')

  await fs.rm(DIST_DIR, { recursive: true, force: true })

  const files = filenames.map((filename) => path.join(LIB_DIR, filename))

  const tracingStartTime = Date.now()
  const { fileList } = await nodeFileTrace(files)
  console.log(
    `Traced ${files.length} sources in ${Date.now() - tracingStartTime}ms`
  )

  console.log(`Extracting ${fileList.size} files...`)

  const copyStartTime = Date.now()

  await Promise.all(
    [...fileList].map(async (file) => {
      const dest = path.join(DIST_DIR, file)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await copySymlink(file, dest, { recursive: true })
    })
  )

  console.log(
    `Extracted ${fileList.size} files in ${Date.now() - copyStartTime}ms`
  )

  const MODULES_DIR = path.join(LIB_DIR, '../node_modules')

  const DIST_NODE_DIR = path.join(DIST_DIR, 'node_modules')
  const VENDOR_DIR = path.join(DIST_DIR, 'vendor_modules')

  await fs.rename(DIST_NODE_DIR, VENDOR_DIR)
  await fs.symlink('vendor_modules', DIST_NODE_DIR)
  await fs.writeFile(path.join(DIST_DIR, '.env'), 'NODE_PATH=vendor_modules')

  await fs.copyFile(
    path.join(LIB_DIR, '../package.json'),
    path.join(DIST_DIR, 'package.json')
  )

  const { dependencies } = await cleanPackageJson(DIST_DIR)

  const deps = Object.keys(dependencies)
  await Promise.all(
    deps.map(async (dep) => {
      const src = path.join(MODULES_DIR, dep)
      const dest = path.join(VENDOR_DIR, dep)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await copySymlink(src, dest).catch((e) => {
        console.warn('WARNING: Failed to copy symlinked dependency: ', dep, e)
      })
    })
  )

  await fs.access(path.join(MODULES_DIR, '/.bin/firebase-functions'))
  await fs.mkdir(path.join(VENDOR_DIR, '.bin'), { recursive: true })
  const FF_BIN = path.join(VENDOR_DIR, '.bin/firebase-functions')
  await fs.symlink(path.join(__dirname, '_firebase-functions'), FF_BIN)
}

main(['index.js'])

const cleanPackageJson = async (DIST_DIR) => {
  const packageJsonPath = path.resolve(DIST_DIR, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  try {
    const json = structuredClone(packageJson)
    delete json['dependencies']
    delete json['devDependencies']
    delete json['scripts']

    await fs.writeFile(packageJsonPath, JSON.stringify(json, null, 2))
  } catch (error) {
    console.error('Failed to remove devDependencies:', error)
  }
  return packageJson
}
