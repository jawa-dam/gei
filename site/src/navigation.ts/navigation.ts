export interface NavigationItem {
  label: string;
  href: string;
}

export const navigation: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Academy', href: '/academy' },
  { label: 'Studio', href: '/studio' },
  { label: 'Playground', href: '/playground' },
];