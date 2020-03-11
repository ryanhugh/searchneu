/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// Tell typescript what happens when an SVG file is imported in javascript
declare module '*.svg' {
  const content: string;
  export default content;
}
