import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { stockApiPlugin } from './src/server/apiPlugin'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [stockApiPlugin(), devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
