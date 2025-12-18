import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Este archivo personaliza el HTML que genera Expo Router para la web.
 * Es especialmente importante para configurar correctamente los iconos PWA
 * y las metaetiquetas de iOS/Safari.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* 
          Reset de estilos de ScrollView para web
          Esto asegura que el scroll funcione correctamente en navegadores
        */}
        <ScrollViewStyleReset />

        {/* 
          ⚠️ IMPORTANTE: Icono de Apple Touch para iOS
          Safari busca automáticamente este archivo en /public/apple-touch-icon.png
          Tamaño recomendado: 180x180px
        */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* 
          Favicon estándar para navegadores
          Si tu favicon tiene diferentes tamaños, puedes añadir más links aquí
        */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />

        {/* 
          Metaetiquetas críticas para PWA en iOS/Safari
          Estas son esenciales para que la app se comporte como una PWA nativa
        */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ALMA" />
        
        {/* 
          Metaetiquetas adicionales para mejorar la experiencia PWA
        */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="ALMA: Tu legado digital. Guarda tus recuerdos familiares y crea tu árbol de vida." />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
