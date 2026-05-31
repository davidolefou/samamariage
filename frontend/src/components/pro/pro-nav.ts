// SamaMariage Pro — navigation de la sidebar du portail prestataire.

export interface ProNavItem {
  href: string;
  label: string;
  /** clé d'icône rendue par <ProNavIcon/> dans ProShell */
  icon: string;
}

export const PRO_NAV: ProNavItem[] = [
  { href: '/pro/dashboard', label: "Vue d'ensemble", icon: 'overview' },
  { href: '/pro/demandes', label: 'Demandes de devis', icon: 'demandes' },
  { href: '/pro/agenda', label: 'Mon agenda', icon: 'agenda' },
  { href: '/pro/vitrine', label: 'Ma vitrine', icon: 'vitrine' },
  { href: '/pro/avis', label: 'Avis & notes', icon: 'avis' },
  { href: '/pro/paiements', label: 'Paiements', icon: 'paiements' },
];
