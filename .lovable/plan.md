# Bring the "my-menu-canvas" menu app into this project

The GitHub project is public and already built with the same setup as this project, so it can be moved over as-is: a mobile-first digital menu catalogue for Umaeh Inyong (sate kambing), with a photo lightbox, favourites, and WhatsApp sharing.

## What you'll get

- The menu home page replacing the current blank page: cover page plus 9 menu photos with titles and subtitles.
- Tap a photo to open it fullscreen with zoom and swipe between pages.
- Save favourites (kept on the device) and a share-to-WhatsApp button.
- The same look, fonts, colours, and page title/description as the original.

## How it will be done

1. Copy all application files from the downloaded repository into this project: routes, components, menu data, hooks, helper code, styles, and configuration.
2. Install the extra packages the app needs (the ones listed in its package file that aren't here yet).
3. Handle the 9 menu photos. The repository only stores pointers to images owned by the original project, so they may not display here. Plan: first check whether they load; if not, download the photos from the original app and re-register them in this project, then update the pointers.
4. Check the app in the preview at phone size: home page renders, images load, lightbox opens, favourites and WhatsApp share work, and no errors appear.

## Notes

- The app has no database, login, payments, or external services, so nothing needs to be connected.
- Nothing from the original project is changed; this only reads a copy.
- Anything of yours currently in this project's home page is a placeholder and will be replaced.
