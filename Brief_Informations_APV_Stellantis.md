# Brief Informations — Chatbot Après-Vente Stellantis Maroc

**Destinataire :** Direction Après-Vente Stellantis Maroc
**Émetteur :** équipe projet chatbot Rihla
**Objet :** informations à fournir pour finaliser le chatbot APV
**Échéance souhaitée :** sous 7 jours ouvrés afin de préparer la mise en production

---

## 1. Contexte

Le chatbot Rihla est un assistant conversationnel déployé sur les sites de marque Stellantis Maroc (Jeep d'abord, puis Citroën et Peugeot). Il sait aujourd'hui qualifier un prospect commercial et organiser un essai routier ou une visite en concession. Nous étendons maintenant son périmètre à l'**Après-Vente** : prise de rendez-vous atelier, réponses à la base de connaissance (garantie, entretien, accessoires…) et collecte de réclamations.

Pour que l'expérience client soit irréprochable et conforme aux engagements de marque, **nous avons besoin de votre validation et de plusieurs jeux d'informations métier**. Ce document liste précisément ce qu'il nous faut, dans quel format, et pourquoi.

Plus l'information est précise, plus le chatbot sera précis. Inversement, sans ces données nous serons obligés d'ajouter des formules génériques ("un conseiller vous rappellera") qui dégradent la valeur perçue par le client.

Vous pouvez déléguer chaque section à la personne de votre équipe la mieux placée. Nous restons disponibles pour un point de cadrage si besoin.

---

## 2. Vue d'ensemble — sections à compléter

| # | Section | Délégué suggéré | Temps estimé | Statut |
|---|---|---|---|---|
| 3 | Réseau & sites (ateliers, horaires) | Coordinateur réseau | ~1 h | ☐ |
| 4 | Base de connaissance (KB) | Référent garantie + référent pièces | ~3 h | ☐ |
| 5 | Parcours RDV — règles métier | Direction APV | ~30 min | ☐ |
| 6 | Parcours Réclamation — process CRC | Responsable CRC | ~30 min | ☐ |
| 7 | Intégration Salesforce | DSI / IT | ~1 h | ☐ |
| 8 | Conformité — texte CNDP | Juridique / DPO | ~30 min | ☐ |
| 9 | Escalade humaine | Direction APV + CRC | ~30 min | ☐ |
| 10 | KPI & reporting | Direction APV | ~30 min | ☐ |
| 11 | Données de test | DSI / Atelier pilote | ~30 min | ☐ |
| 12 | Roadmap d'extension | Direction APV | ~15 min | ☐ |

Total : ~8 heures de travail réparties sur 4 à 6 collaborateurs.

---

## 3. Réseau & sites — Liste des concessionnaires / ateliers

**Pourquoi.** Le chatbot doit pouvoir orienter le client vers un atelier réel, lui donner l'adresse et le téléphone, et envoyer la demande au bon site dans Salesforce. Sans la liste exhaustive et à jour, nous nous appuyons sur des données scrapées du site officiel qui peuvent être incomplètes.

**Format demandé.** Tableau Excel ou Google Sheet avec une ligne par site. Champs ci-dessous (X = obligatoire, O = optionnel) :

| Champ | Type | Exemple | Obligatoire |
|---|---|---|---|
| Nom du site | Texte | Jeep Casablanca Anfa | X |
| Marque(s) traitée(s) | Liste | Jeep, Citroën | X |
| Ville | Texte | Casablanca | X |
| Quartier / zone | Texte | Anfa | O |
| Adresse complète | Texte | Bd. Anfa, n°123, Casablanca 20100 | X |
| Géolocalisation (lat, lng) | Décimal | 33.5731, -7.5898 | O |
| Téléphone fixe | Texte | +212 522 39 50 22 | X |
| WhatsApp Business (si différent) | Texte | +212 662 11 22 33 | O |
| Email contact APV | Texte | apv.casa@jeep.ma | O |
| Horaires (semaine) | Texte | Lun-Ven 8h30–18h | X |
| Horaires (samedi) | Texte | Sam 9h–14h | O |
| Capacité Mécanique | Oui/Non | Oui | X |
| Capacité Carrosserie | Oui/Non | Oui | X |
| Concessionnaire principal | Oui/Non | Oui | O |
| Notes spécifiques | Texte | Atelier hybride / EV certifié | O |

**Une question importante :** existe-t-il des sites *spécialisés* (ex. uniquement carrosserie, uniquement véhicules électriques) ? Si oui, le chatbot doit le savoir pour ne pas envoyer un client mal aiguillé.

---

## 4. Base de connaissance (KB) — Contenus à fournir

**Pourquoi.** Le chatbot répond aux questions clients sur la garantie, l'entretien, les accessoires, etc. Pour chaque question il doit citer une source officielle approuvée par la marque — pas du contenu inventé. Aujourd'hui nous prévoyons de récupérer ces contenus sur les pages publiques du site (vous nous avez déjà partagé les URLs Jeep Maroc) **mais nous avons besoin de votre validation** : ces pages sont-elles bien la source de vérité, ou y a-t-il des informations plus précises qui ne sont pas en ligne ?

Pour chaque sous-thème, vous nous indiquez :

1. **La source** : URL d'une page publique du site, document PDF interne, ou texte que vous nous fournissez directement.
2. **Le périmètre** : ce qui peut être communiqué au public sans restriction.
3. **Les zones d'ombre** : ce que le chatbot doit *refuser* de répondre et rediriger vers un conseiller (ex. tarifs négociés, conditions promotionnelles).

### 4.1 Garantie constructeur

Sous-questions clients fréquentes :
- Quelle est la durée de garantie ?
- Qu'est-ce qui est couvert / exclu ?
- Ma garantie est-elle encore valable ?
- Que faire si une pièce tombe en panne sous garantie ?

À fournir :

| Élément | Détail demandé |
|---|---|
| Durée standard par modèle | Ex. Wrangler : 3 ans / 100 000 km, Cherokee : 2 ans / illimité km |
| Composants couverts | Liste précise (moteur, transmission, électronique, etc.) |
| Composants exclus | Liste précise (pneumatiques, plaquettes, batterie hors hybride…) |
| Procédure de prise en charge | Étapes que le client doit suivre |
| Documents requis | Carte grise, carnet d'entretien, facture d'origine ? |
| Variations selon modèle | Spécifier si le Renegade a une garantie différente du Wrangler |
| URL ou document de référence | Page officielle ou PDF que nous citerons |

### 4.2 Extension de garantie

Sous-questions clients fréquentes :
- Combien coûte une extension de garantie ?
- Jusqu'à quand puis-je souscrire ?
- Quelles sont les formules disponibles ?

À fournir :

| Formule | Durée | Kilométrage | Tarif TTC | Délai souscription post-achat | Conditions d'éligibilité |
|---|---|---|---|---|---|
| (Ex. Flex Care 1) | 3 ans | 60 000 km | À partir de XXX DH | Jusqu'à 6 mois | Tous modèles ICE |
| (Ex. Flex Care 2) | 4 ans | 80 000 km | À partir de XXX DH | Jusqu'à 6 mois | Hors Wrangler |
| … | | | | | |

**Question :** souhaitez-vous que le chatbot communique des **tarifs précis** ou seulement une **fourchette indicative** + invitation à demander un devis ? (Notre recommandation : fourchette indicative pour ne pas s'engager sur un prix qui change.)

### 4.3 Contrat d'entretien

Sous-questions clients fréquentes :
- Qu'inclut un contrat d'entretien ?
- Quel est le tarif ?
- Puis-je payer en plusieurs fois ?

À fournir :

| Formule | Prestations incluses | Fréquence | Durée | Tarif TTC | Modalités de paiement |
|---|---|---|---|---|---|
| (Ex. Sérénité) | Vidange, filtres, contrôles 18 points | 12 mois ou 15 000 km | 3 ans | XXX DH | 3× sans frais possible |
| … | | | | | |

### 4.4 Accessoires d'origine

Sous-questions clients fréquentes :
- Avez-vous des tapis de sol pour ma Jeep ?
- Combien coûte une barre de toit ?
- Quels accessoires pour mon Renegade ?

À fournir :

Idéalement un **catalogue Excel** avec une ligne par référence accessoire, colonnes :

| Champ | Exemple |
|---|---|
| Modèle compatible | Wrangler JL 2018+ |
| Catégorie | Tapis / barres de toit / coffre / tuning / sécurité… |
| Nom commercial | Tapis caoutchouc Mopar® avant |
| Référence pièce | 82215147AB |
| Tarif TTC indicatif | 850 DH |
| Disponibilité | Stock permanent / sur commande |
| URL site officiel | https://… |

À défaut, indiquez les **catégories couvertes** et le **canal** où les clients peuvent consulter le catalogue complet (boutique en ligne, atelier).

### 4.5 Campagnes de rappel

Sous-questions clients fréquentes :
- Mon véhicule est-il concerné par un rappel ?
- Où trouver l'info sur le rappel airbag X ?

À fournir :

| Champ | Exemple |
|---|---|
| Référence campagne | RAP-2024-001 |
| Modèles concernés | Renegade MY 2019-2020 (VIN dans plage XYZ→ABC) |
| Composant impacté | Airbag passager |
| Procédure de prise en charge | Prendre RDV — intervention gratuite, durée 1 h |
| Date d'ouverture / fermeture | 15/01/2024 — en cours |
| Source officielle | Communiqué constructeur, lien |

**Important :** existe-t-il une **base de données interne** (CSV, API SF, autre) où nous pourrions vérifier un VIN contre les rappels actifs ? Si oui, c'est l'idéal — le chatbot pourra répondre par VIN. Sinon, nous nous limiterons à lister les rappels actifs sans personnalisation.

### 4.6 FAQ générale

Questions courantes :
- Quels sont les horaires des ateliers ?
- Où sont les ateliers proches de chez moi ?
- Que faire en cas de panne sur autoroute ?
- Comment contacter le service client ?

À fournir :

| Sujet | Réponse souhaitée |
|---|---|
| Horaires standard ateliers | Ex. Lun-Ven 8h30-18h, Sam 9h-14h, fermé Dim |
| Numéro assistance routière 24/7 | Ex. 5050 (Jeep Maroc) — confirmer ou correctif |
| Numéro CRC général | Ex. 0801 00 12 12 |
| Email CRC général | Ex. service-client@jeep.ma |
| Délai de réponse standard | Ex. 24 h ouvrées |
| Politique de courtoisie (véhicule de prêt) | Conditions d'éligibilité |
| Glossaire technique | Vidange = …, distribution = …, révision = … (utile en darija) |

---

## 5. Parcours RDV (prise de rendez-vous atelier)

**Pourquoi.** Le chatbot collecte 11 informations puis crée une demande de RDV. Nous avons aujourd'hui implémenté les règles de validation **selon le cahier des charges Stellantis** que vous nous avez transmis. Nous vous demandons de **valider ces règles** ou de les ajuster.

### 5.1 Validation des champs — à confirmer

| Champ | Règle actuelle | Action si invalide | Validez ? |
|---|---|---|---|
| Nom complet | Min. 2 mots, 3-80 car. | Reformulation | ☐ |
| Téléphone | +212 ou 06/07 + 8 chiffres | Reformulation | ☐ |
| Email | Format standard RFC | Reformulation | ☐ |
| Marque véhicule | Liste Stellantis | Pré-rempli sur widget Jeep | ☐ |
| Modèle | Liste dynamique | Demander précision | ☐ |
| VIN | 17 car., excl. I/O/Q | "Vérifier sur la carte grise" | ☐ |
| Nature intervention | Mécanique / Carrosserie | Liste à 2 choix | ☐ |
| Ville | Liste des sites | Si hors couverture, lister sites | ☐ |
| Date | J+1 à J+30, hors dim. + jours fériés | Reformulation | ☐ |
| Créneau | Matin / Après-midi | Liste à 2 choix | ☐ |
| Commentaire | 0-500 car., libre | — | ☐ |

### 5.2 Données nécessaires de votre côté

| Question | Votre réponse |
|---|---|
| Liste exhaustive des **villes** où la marque a un atelier | __________________________ |
| Souhaitez-vous **bloquer certaines plages** (ex. fin de mois, semaine pic d'activité) ? | ☐ Oui : ___________ ☐ Non |
| Liste des **jours fériés au Maroc 2026-2027** validée par vos soins | ☐ Confirmer notre liste ☐ Nous transmettre la vôtre |
| Le **véhicule de courtoisie** est-il proposé pour certaines interventions ? Si oui, le chatbot doit-il le mentionner ? | __________________________ |
| Le **chiffrage estimatif** est-il possible (ex. "vidange ≈ X DH") ou strict tabou ? | ☐ Pas de chiffrage ☐ Fourchette indicative ☐ Tarif précis |

### 5.3 Délai de rappel client

Aujourd'hui le chatbot annonce : *« Un conseiller vous contactera sous 24 h ouvrées pour confirmer le créneau. »*

Validez-vous ce délai ? Sinon, indiquez le délai réel : _______ heures ouvrées.

---

## 6. Parcours Réclamation

**Pourquoi.** Le chatbot collecte 10 informations + le motif détaillé, puis envoie un ticket Salesforce qui sera qualifié par le CRC. Nous avons besoin de comprendre votre processus aval pour calibrer les messages clients.

### 6.1 Process CRC — questions

| Question | Votre réponse |
|---|---|
| Quel **délai SLA** pour la 1ʳᵉ prise de contact CRC après réception d'un ticket ? | _______ heures ouvrées |
| Le CRC est-il **joignable les samedis / dimanches** ? | ☐ Sam ouvré ☐ Dim fermé ☐ Autres : _________ |
| Quels **types de réclamations** sont escaladés en priorité (urgent/criticité haute) ? | __________________________ |
| Existe-t-il une **matrice de criticité** que vous pouvez nous partager (urgence / légitimité / récurrence) ? | ☐ Oui (joindre) ☐ Non |
| Le CRC enregistre-t-il les **doublons** automatiquement ou manuellement ? | ☐ Auto ☐ Manuel |
| Existe-t-il un **numéro d'urgence** (panne, accident, immobilisation) à communiquer au client en début de réclamation ? | _______________________ |
| Souhaitez-vous une **enquête de satisfaction post-clôture** envoyée par le chatbot ? | ☐ Oui ☐ Non ☐ Plus tard |

### 6.2 Pièces jointes

Le cahier des charges prévoit la possibilité pour le client d'envoyer une photo / un PDF avec sa réclamation.

| Question | Votre réponse |
|---|---|
| Souhaitez-vous activer cette fonctionnalité ? | ☐ Oui ☐ Non ☐ Phase 2 |
| Si oui, taille max acceptée | ☐ 5 Mo ☐ 10 Mo ☐ Autre : _____ |
| Formats acceptés | ☐ JPG/PNG ☐ PDF ☐ HEIC ☐ Tous |
| Stockage : votre Salesforce ou notre côté ? | ☐ SF ContentVersion ☐ Notre stockage ☐ Les deux |

### 6.3 Délais annoncés au client

Aujourd'hui le chatbot annonce : *« Le Centre de Relation Client vous recontactera sous 48 h ouvrées. »*

Validez-vous ce délai ? Sinon, indiquez : _______ heures ouvrées.

---

## 7. Intégration Salesforce

**Pourquoi.** Toutes les demandes (RDV, réclamation, lead commercial) doivent atterrir dans votre Salesforce pour être traitées par les équipes existantes. Nous avons reçu de votre DSI un cahier de mapping précis ; il nous faut maintenant les **endpoints réels et les credentials**.

### 7.1 Environnements

| Environnement | URL Salesforce | Statut |
|---|---|---|
| Sandbox / UAT | https:// | ☐ Disponible ☐ À provisionner |
| Production | https:// | ☐ Disponible ☐ À provisionner |

### 7.2 Endpoints exposés

À confirmer / compléter d'après le cahier des charges :

| Endpoint | Méthode | À fournir |
|---|---|---|
| /apex/chatbot/appointment | POST | URL exacte + corps de payload |
| /apex/chatbot/complaint | POST | URL exacte + corps de payload |
| /apex/chatbot/lookup-vin | GET | URL + format de réponse |
| /apex/chatbot/status/{id} | GET | URL + format de réponse |

### 7.3 Authentification

| Question | Votre réponse |
|---|---|
| Méthode | ☐ OAuth 2.0 client_credentials ☐ JWT Bearer ☐ Username-Password ☐ Autre |
| URL token endpoint | https:// |
| Client ID + Secret | À transmettre via canal sécurisé (1Password, vault…) |
| Scopes nécessaires | ___________________ |
| Durée de vie du token | _______ minutes |

### 7.4 Mapping des champs

Nous avons retenu le mapping de votre cahier (sheet 6). **Confirmez-vous** ce mapping ou y a-t-il des ajustements ?

- nom_complet → Contact.Name (scission Prénom/Nom côté SF) ☐ OK ☐ Modif : _____
- telephone → Contact.MobilePhone (E.164) ☐ OK ☐ Modif : _____
- email → Contact.Email ☐ OK ☐ Modif : _____
- vin → Asset.SerialNumber ☐ OK ☐ Modif : _____
- nature_intervention → Case.Intervention_Type__c ☐ OK ☐ Modif : _____
- ville → Case.Preferred_Site__c ☐ OK ☐ Modif : _____
- date_souhaitee → Case.Preferred_Date__c ☐ OK ☐ Modif : _____
- creneau → Case.Preferred_Slot__c ☐ OK ☐ Modif : _____
- motif → Case.Description ☐ OK ☐ Modif : _____
- source_chatbot → Case.Origin = "Chatbot" ☐ OK ☐ Modif : _____

### 7.5 Cas d'erreur

| Code | Notre comportement actuel | À valider |
|---|---|---|
| 200 OK | Confirmation client + numéro de référence | ☐ |
| 400 Bad Request | Reformuler le champ fautif | ☐ |
| 401 Unauthorized | Renouveler token + retry 1 fois | ☐ |
| 404 VIN inconnu | Continuer sans pré-remplissage | ☐ |
| 500 / Timeout | Sauvegarde locale + notification CRC par email | ☐ |

**Question :** votre Salesforce a-t-il une limite de débit (rate limit) que nous devons respecter ? _______ requêtes/min.

---

## 8. Conformité — texte CNDP

**Pourquoi.** Avant de transmettre les données client à votre Salesforce, le chatbot doit obtenir le **consentement explicite** du client (loi 09-08 / CNDP). Le texte affiché doit être validé par votre service juridique.

Aujourd'hui le chatbot dit (en français) :

> *« Vos données seront transmises à notre Centre de Relation Client pour traitement. Acceptez-vous ? »*

Avec les variantes en darija, arabe et anglais.

| Question | Votre réponse |
|---|---|
| Le texte ci-dessus est-il **validé par le juridique** ? | ☐ OK ☐ Modif joint : _____ |
| Devez-vous mentionner **explicitement** la finalité (ex. "afin de traiter votre demande de RDV / réclamation") ? | ☐ Oui ☐ Non |
| Devez-vous mentionner **la durée de conservation** des données ? Si oui, durée : | _______ |
| Le client doit-il pouvoir **demander la suppression** depuis le chatbot ? | ☐ Oui ☐ Non |
| Avez-vous une **mention obligatoire** sur le droit d'accès / rectification ? | Texte : _____ |
| Lien vers la **politique de confidentialité** | https:// |
| Le chatbot doit-il afficher un **bandeau cookies** dès le premier message ? | ☐ Oui ☐ Non |

---

## 9. Escalade humaine

**Pourquoi.** Certains cas dépassent le périmètre du chatbot (urgence, situation complexe, refus du client). Il faut un mécanisme propre pour passer la main.

| Question | Votre réponse |
|---|---|
| Le client doit-il pouvoir demander un conseiller humain à tout moment ? | ☐ Oui (recommandé) ☐ Non |
| Si oui, quel canal utiliser ? | ☐ Numéro téléphone CRC ☐ WhatsApp ☐ Email ☐ Demande de rappel |
| Mots-clés / phrases à détecter pour déclencher l'escalade | "conseiller, humain, agent, parler à quelqu'un…" |
| Après combien d'échecs de compréhension le chatbot propose-t-il un humain ? | ☐ 1 ☐ 2 (recommandé) ☐ 3 |
| Heures d'ouverture du CRC pour réception des escalades en direct | _____________ |
| Hors heures CRC : promesse au client | "Un conseiller vous rappellera demain matin" / autre : _____ |

---

## 10. KPI & reporting

**Pourquoi.** Pour piloter le chatbot et arbitrer les évolutions, il faut un cadre de mesure. Nous avons proposé un set de KPI dans le cahier des charges. Validez vos cibles.

| Indicateur | Cible proposée | Votre cible |
|---|---|---|
| Taux d'abandon avant soumission | < 25 % | ☐ Confirme ☐ Cible : _____ |
| Taux de complétion RDV | ≥ 75 % | ☐ Confirme ☐ Cible : _____ |
| Taux de complétion Réclamation | ≥ 70 % | ☐ Confirme ☐ Cible : _____ |
| Taux de réponse KB utile | ≥ 80 % | ☐ Confirme ☐ Cible : _____ |
| Taux d'escalade humaine | < 20 % | ☐ Confirme ☐ Cible : _____ |
| Durée moyenne session | < 5 min | ☐ Confirme ☐ Cible : _____ |
| Taux d'erreur API SF | < 2 % | ☐ Confirme ☐ Cible : _____ |
| NPS chatbot | ≥ 40 | ☐ Confirme ☐ Cible : _____ |

| Question | Votre réponse |
|---|---|
| Fréquence souhaitée du **reporting** | ☐ Hebdomadaire ☐ Mensuel ☐ Les deux |
| Format souhaité | ☐ Tableau de bord en ligne ☐ Export Excel ☐ Email récap |
| Destinataires du reporting | _____________________ |
| Souhaitez-vous une **alerte temps réel** sur certains événements (ex. réclamation urgente) ? | ☐ Oui : ___________ ☐ Non |

---

## 11. Données de test

**Pourquoi.** Pour valider de bout en bout la chaîne (chatbot → SF → CRC → site → client), il nous faut quelques jeux de test réalistes.

| Demande | Détail |
|---|---|
| **5 à 10 VIN réels** de véhicules en circulation, accompagnés du nom du client (anonymisable) — pour tester le pré-remplissage VIN | _____________ |
| **2 à 3 comptes Salesforce sandbox** dédiés aux tests | _____________ |
| **1 atelier pilote** disposé à recevoir les premières demandes de production (limited release) | _____________ |
| **1 référent CRC** pour le suivi des tickets de test | Nom + email |

---

## 12. Roadmap d'extension

**Pourquoi.** Le chatbot est aujourd'hui activé sur le widget Jeep. Stellantis Maroc commercialise plusieurs marques sous le même réseau. Nous souhaitons cadrer la suite avec vous.

| Marque | Site déployé ? | Périmètre APV souhaité | Échéance cible |
|---|---|---|---|
| Jeep | ☑ En production | RDV + KB + Réclamation | Phase 1 (en cours) |
| Citroën Maroc | À déployer | ☐ RDV ☐ KB ☐ Réclamation | __________ |
| Peugeot Maroc | À déployer | ☐ RDV ☐ KB ☐ Réclamation | __________ |
| Alfa Romeo | ☐ Pas prévu pour l'instant | | |
| DS | ☐ Pas prévu pour l'instant | | |
| Fiat | ☐ Pas prévu pour l'instant | | |
| Leapmotor (EV) | ☐ Pas prévu pour l'instant | | |
| Spoticar (VO) | ☐ Pas prévu pour l'instant | | |

| Question | Votre réponse |
|---|---|
| Le chatbot doit-il être déployé aussi sur **WhatsApp Business** ? | ☐ Phase 1 ☐ Phase 2 ☐ Pas prévu |
| Souhaitez-vous une **version mobile native** intégrée à votre app ? | ☐ Oui ☐ Plus tard |
| Souhaitez-vous le déploiement **multi-pays** (Tunisie, Algérie, Sénégal…) ? | ☐ Oui : _____ ☐ Non |

---

## 13. Préférences de tonalité

**Pourquoi.** Le chatbot adapte sa tonalité par marque. Pour Jeep nous l'avons calibré sur "confiance tranquille, ADN aventure, propriétaire enthousiaste". Validez ou ajustez.

| Question | Votre réponse |
|---|---|
| Tonalité Jeep souhaitée | ☐ "Confiance tranquille, aventure" (notre version) ☐ Autre : _____ |
| Niveau de langue (FR) | ☐ Vouvoiement systématique (notre version) ☐ Tutoiement |
| Usage du **darija** | ☐ Possible si le client l'utilise (notre version) ☐ FR/AR uniquement ☐ Autre |
| Émojis dans les messages | ☐ Jamais ☐ Rare et ciblé (notre version) ☐ Libre |
| Humour / aparté warm | ☐ 1 fois max par conversation (notre version) ☐ Pas du tout ☐ Libre |
| Mention du **VIN** d'un client connu en réponse | ☐ "Bonjour Aymane, je vois votre Wrangler 2022" (notre version) ☐ Plus discret |
| Phrases interdites / mots à éviter | _____________________ |

---

## 14. Mentions et claims réglementaires

| Question | Votre réponse |
|---|---|
| Le chatbot peut-il citer un **prix** (modèle, accessoire) ? | ☐ Oui, indicatif ☐ Non |
| Le chatbot peut-il **promettre une date de livraison** d'une intervention ? | ☐ Oui ☐ Non (recommandé) |
| Le chatbot peut-il citer un **taux de financement** ? | ☐ Oui : ☐ Non |
| Le chatbot doit-il afficher la **mention "À titre indicatif, sous réserve de…"** sur les tarifs ? | Texte : _________ |
| Le chatbot peut-il **comparer Jeep à un concurrent** ? | ☐ Pas de comparaison ☐ Comparaison neutre OK |
| Existe-t-il un **glossaire d'expressions interdites** marketing / juridique ? | ☐ Oui (joindre) ☐ Non |

---

## 15. Comment nous renvoyer ces informations

**Format préféré :**
- Renvoyer ce document complété (Word, PDF ou Markdown — peu importe) **par email**.
- Pour les annexes (Excel des sites, catalogue accessoires, contrats type, communiqués de rappel), un dossier partagé (Google Drive, OneDrive, SharePoint) accélère le traitement.
- Pour les **credentials Salesforce** : merci de NE PAS les envoyer par email. Utilisez un coffre-fort partagé (1Password, Bitwarden, Dashlane Business) ou un canal sécurisé interne. Nous vous transmettrons l'invitation au coffre.

**Contact :**
- **Zakaria** — Email : zakaria@volund-ventures.com
- Disponibilité pour un point de cadrage de 30 min si certaines sections nécessitent une discussion : nous proposons un créneau dans les 48 h après réception de vos premières réponses.

**Délai cible :** sous **7 jours ouvrés**. Si certaines sections demandent plus de temps (ex. validation juridique du texte CNDP), envoyez ce qui est prêt en premier — nous démarrerons les sections débloquées en parallèle.

---

## Annexe — qui répond à quoi

Pour faciliter la délégation interne, voici la matrice indicative :

| Section | Personne idéale | Contributeur(s) secondaire(s) |
|---|---|---|
| 3. Réseau & sites | Coordinateur réseau | Concessionnaires |
| 4. Base de connaissance | Référent garantie + référent pièces | Marketing, Juridique pour exclusions |
| 5. Parcours RDV | Direction APV | DSI pour règles techniques |
| 6. Parcours Réclamation | Responsable CRC | Direction APV |
| 7. Intégration Salesforce | DSI / IT Stellantis | Architecte SF |
| 8. Texte CNDP | Juridique / DPO | Direction APV |
| 9. Escalade humaine | Direction APV + CRC | — |
| 10. KPI & reporting | Direction APV | Contrôle de gestion |
| 11. Données de test | DSI + atelier pilote | CRC |
| 12. Roadmap d'extension | Direction APV | Direction commerciale |
| 13. Tonalité | Direction APV + Marketing | Brand manager Jeep |
| 14. Mentions réglementaires | Juridique | Marketing |

---

*Merci par avance pour votre coopération. Plus tôt nous recevons ces informations, plus tôt votre chatbot APV délivrera de la valeur réelle à vos clients — au-delà de la démo. Restons à votre écoute pour toute question de cadrage.*
