/* Page d'accueil : registre des outils + traductions. */
(() => {
'use strict';

/* Registre des outils : pour en ajouter un, créez son dossier, ajoutez une ligne ici
   et ses textes (name/desc) dans les deux langues. */
const TOOLS = [
  { path: 'tirage/', icon: '🎲', name: 'tirage.name', desc: 'tirage.desc' },
  { path: 'compteur/', icon: '🏆', name: 'compteur.name', desc: 'compteur.desc' },
  { path: 'undercover/', icon: '🕵️', name: 'undercover.name', desc: 'undercover.desc' },
  { path: 'codenames/', icon: '🗝️', name: 'codenames.name', desc: 'codenames.desc' }
];

const t = Outils.i18n({
  fr: {
    title: 'Boîte à outils',
    lead: 'Mes petites applis du quotidien, utilisables depuis n\'importe quel appareil. Les données restent dans votre navigateur.',
    count: '{n} outils',
    'tirage.name': 'Tirage & Équipes',
    'tirage.desc': 'Tirez au sort dans une liste ou répartissez-la en équipes équilibrées.',
    'compteur.name': 'Compteur de points',
    'compteur.desc': 'Comptez les scores des soirées jeux : classement animé, objectif et manches.',
    'undercover.name': 'Undercover',
    'undercover.desc': 'Le jeu d\'ambiance sur un seul téléphone : civils, undercovers et Mister White.',
    'codenames.name': 'CodeName',
    'codenames.desc': 'Jeu d\'espions en équipes : vue espion et vue joueur synchronisées en direct sur vos téléphones.'
  },
  en: {
    title: 'Toolbox',
    lead: 'My everyday little apps, available from any device. Your data stays in your browser.',
    count: '{n} tools',
    'tirage.name': 'Draw & Teams',
    'tirage.desc': 'Draw random picks from a list or split it into balanced teams.',
    'compteur.name': 'Score counter',
    'compteur.desc': 'Keep score on game nights: animated ranking, target score and rounds.',
    'undercover.name': 'Undercover',
    'undercover.desc': 'The party game on a single phone: civilians, undercovers and Mr. White.',
    'codenames.name': 'CodeName',
    'codenames.desc': 'Team spy game: spymaster and player views synced live across your phones.'
  }
});

Outils.initTopbar();
Outils.applyI18n(t);
document.getElementById('count').textContent = t('count', { n: TOOLS.length });

const list = document.getElementById('tools');
for (const tool of TOOLS) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'tool glass';
  a.href = tool.path;
  const icon = document.createElement('span'); icon.className = 'tool-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = tool.icon;
  const h = document.createElement('h2'); h.textContent = t(tool.name);
  const p = document.createElement('p'); p.textContent = t(tool.desc);
  a.append(icon, h, p);
  li.append(a);
  list.append(li);
}
})();
