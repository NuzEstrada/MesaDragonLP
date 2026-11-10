# Sitio web móvil para café

Este proyecto es una landing page o sitio web móvil para una cafetería, desarrollado con React + Vite + Tailwind CSS.

## Menú y juegos desde Excel

Sube los archivos `Menu.xlsx` y `Juegos.xlsx` a la carpeta `public/`. La página lee la primera hoja de cada archivo (o las hojas llamadas `MenuMesaDragon` y `Juegos`). Para actualizar el catálogo, reemplaza esos archivos y recarga la página. Al publicar cambios, incluye los Excel actualizados.

Los encabezados son:

- Menú: `category`, `name`, `description`, `price`, `detail`. La categoría crea cada pestaña del menú; `description`, `price` y `detail` pueden quedar vacíos.
- Juegos: `name`, `image`, `minPlayers`, `maxPlayers`, `players`, `minMinutes`, `maxMinutes`, `time`, `difficulty`, `genres`, `age`, `description`. `minPlayers`, `maxPlayers`, `minMinutes` y `maxMinutes` aceptan celdas vacías; escribe los géneros separados por comas. `image` debe ser la ruta de una imagen dentro de `public` (por ejemplo, `/juegos/catan.jpg`) o quedar vacía.

Las dificultades admitidas son `Fácil`, `Medio`, `Medio-difícil`, `Difícil` y `[por confirmar]`. Si faltan encabezados o datos obligatorios, la página muestra el error en la sección correspondiente.

## Google Analytics

La app envía eventos a `dataLayer` mediante el contenedor de Google Tag Manager `GTM-K99HXZZ5`, configurado en `index.html`. Configura las etiquetas de medición necesarias desde ese contenedor en Google Tag Manager. Para enviar los eventos a GA4, vincula una etiqueta Google con el ID de medición GA4 de tu propiedad y una etiqueta de evento GA4 disparada por eventos personalizados que coincidan con:

`^(traffic_source_details|button_click|link_click|section_view|section_engagement|booking_request_sent)$`

En la etiqueta de evento, mapea los parámetros del data layer (`source_app`, `referrer_host`, `utm_source`, `utm_medium`, `utm_campaign`, `button_label`, `section_name`, `destination`, `engagement_seconds`, `people_count` y `selected_game_count`) según corresponda. En GA4, registra como dimensiones personalizadas los parámetros que quieras consultar; registra `engagement_seconds` como métrica personalizada para analizar el tiempo por sección. El tiempo se cuenta mientras la sección está visible y la pestaña está activa; el detalle de juegos y las categorías del menú se separan por nombre.

La atribución también depende de la información disponible del navegador. Para identificar redes sociales que no envían referencia, agrega parámetros UTM a sus enlaces (por ejemplo, `utm_source=instagram&utm_medium=social&utm_campaign=perfil`). Los valores de campos de reserva, como nombre, teléfono y comentarios, no se envían a Analytics.
