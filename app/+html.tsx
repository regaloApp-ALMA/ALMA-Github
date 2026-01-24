import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Este archivo web-only inyecta los meta tags necesarios para que iOS
 * trate la web como una App Nativa (PWA Standalone).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* 1. VIEWPORT: Evita que el usuario haga zoom y rompa la sensación de app */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />

        {/* 2. MODO APP SÓLIDA (STANDALONE): Esto quita la barra de URL en iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />

        {/* 3. ESTILO DE BARRA DE ESTADO: Transparente/Negra para que se funda con la app */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ALMA" />

        {/* 4. ICONO: Referencia directa al archivo en la carpeta public */}
        {/* Asegúrate de que existe el archivo /public/icon.png en la raíz del proyecto */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" type="image/png" href="/icon.png" />

        {/* Estilos base de Expo */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
