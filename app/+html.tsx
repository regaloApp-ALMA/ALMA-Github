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

        {/* 1. VIEWPORT RIGUROSO: Evita zoom y escalas indeseadas */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* 2. MODO APP SÓLIDA (STANDALONE): iOS y Android Chrome */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* 3. ESTILO DE BARRA DE ESTADO: Transparente/Negra */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ALMA" />

        {/* 4. ICONOS */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" type="image/png" href="/icon.png" />

        {/* 5. PREVENCIÓN DE REBOTE (OVERSCROLL) */}
        {/* Este script evita el efecto de rebote elástico en iOS Safari que delata que es una web */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('touchmove', function(event) {
                if (event.scale !== 1) { event.preventDefault(); }
              }, { passive: false });
              
              // Evitar scroll elástico en el body principal
              document.body.style.overscrollBehavior = 'none';
              document.documentElement.style.overscrollBehavior = 'none';
            `,
          }}
        />

        {/* Estilos base de Expo */}
        <ScrollViewStyleReset />
      </head>
      <body style={{ overscrollBehavior: 'none', backgroundColor: '#000000' }}>{children}</body>
    </html>
  );
}
