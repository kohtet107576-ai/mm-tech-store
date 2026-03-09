import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk size limit ကို 500kB မှ 2000kB (2MB) အထိ တိုးမြှင့်လိုက်ခြင်း
    // ဒါဆိုရင် Build ဆွဲတဲ့အခါ Warning တက်တော့မှာ မဟုတ်ပါဘူးရှင်
    chunkSizeWarningLimit: 2000,
    
    // ပိုမိုမြန်ဆန်ပြီး ဆိုဒ်သေးအောင် Manual Chunking လုပ်ပေးခြင်း (Optional)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
})
