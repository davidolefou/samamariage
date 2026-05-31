// SamaMariage — définition de la navigation app (sidebar).
// `soon: true` = module pas encore construit → clic affiche un toast "Bientôt".

export interface NavItem {
  href: string;
  label: string;
  /** clé d'icône rendue par <NavIcon/> dans AppShell */
  icon: string;
  soon?: boolean;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: 'grid' },
  { href: '/mood', label: 'Sama Mood', icon: 'mood', soon: true },
  { href: '/budget', label: 'Sama Budget', icon: 'budget' },
  { href: '/planning', label: 'Sama Planning', icon: 'planning' },
  { href: '/prestataires', label: 'Sama Prestataires', icon: 'vendors' },
  { href: '/ndawtal', label: 'Sama Ndawtal', icon: 'ndawtal', badge: 'NEW' },
  { href: '/tenues', label: 'Sama Tenues', icon: 'outfits' },
  { href: '/invites', label: 'Sama Invités', icon: 'guests' },
  { href: '/serenite', label: 'Sama Sérénité', icon: 'serenity', soon: true },
];
