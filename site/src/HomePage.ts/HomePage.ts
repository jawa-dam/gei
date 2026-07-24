import { navigation } from './navigation';

export function HomePage(): string {
  const links = navigation
    .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
    .join('');

  return `
    <main>
      <h1>GEI</h1>
      <p>Genesis Engineered Interpretations.</p>
      <p>A learning and discovery platform for inquiry, knowledge, and creation.</p>
      <ul>${links}</ul>
    </main>
  `.trim();
}