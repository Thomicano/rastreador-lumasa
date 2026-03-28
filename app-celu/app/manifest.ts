import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ya Viene',
    short_name: 'Ya Viene',
    description: 'Encontrá el próximo colectivo de Despeñaderos a Córdoba en segundos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc', // Coincide con el bg-slate-50 del layout
    theme_color: '#f8fafc',      // Tiñe la barra de estado de iOS/Android
    icons: [      
      {
        src: '/logo-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      }      
    ],
  }
}
