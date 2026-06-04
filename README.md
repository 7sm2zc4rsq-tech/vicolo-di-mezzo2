# Le Cantine Vicolo di Mezzo - App Prenotazioni

Applicazione web responsive, mobile-first, pensata per clienti e staff con poca familiarita digitale. La priorita e permettere una prenotazione semplice e una gestione interna chiara.

## 1. Architettura completa

```text
public/
  index.html              Area pubblica e pannello admin in una SPA leggera
  styles.css              Tema grafico ispirato al logo
  app.js                  Logica prenotazioni, admin, Firestore, Authentication
  firebase-config.js      Configurazione Firebase reale, da compilare
  assets/
    logo.jpeg             Logo fornito
    menu-castello.png     Foto menu
    menu-le-prata.png     Foto menu
    panino-prosciutto.png Foto menu
    panino-porchetta.png  Foto menu
firestore.rules           Regole sicurezza Firestore
firebase.json             Firebase Hosting
README.md                 Analisi, wireframe e piano
```

Stack:
- Firebase Authentication per accesso staff.
- Firestore Database per prenotazioni, disponibilita e ruoli.
- Firebase Hosting per pubblicazione.
- HTML, CSS e JavaScript moderni senza build step, per manutenzione semplice.

## 2. Struttura Firestore

```text
/bookings/{bookingId}
  fullName: string
  phone: string
  date: string              YYYY-MM-DD
  time: string              HH:mm
  people: number
  menu:
    castello: number
    lePrata: number
    prosciutto: number
    porchetta: number
  bookingType: "Online" | "Telefonica"
  createdAt: timestamp
  updatedAt: timestamp
  createdByUid: string | null

/availability/{date}
  date: string              YYYY-MM-DD
  maxSeats: number
  updatedAt: timestamp
  updatedByUid: string

/authorizedUsers/{uid}
  email: string
  role: "admin" | "viewer"
  active: boolean
  createdAt: timestamp
```

Nota: per bloccare in modo totalmente atomico l'overbooking in produzione e consigliata una Cloud Function transazionale. In questa prima versione la UI controlla i posti prima del salvataggio e le regole limitano gli accessi.

## Calendario Prenotazioni

Date prenotabili:
- 24 luglio 2026
- 25 luglio 2026
- 26 luglio 2026
- 31 luglio 2026
- 1 agosto 2026
- 2 agosto 2026
- tutti i giorni dal 7 agosto 2026 al 16 agosto 2026

Date non prenotabili dentro il periodo:
- 27, 28, 29, 30 luglio 2026
- 3, 4, 5, 6 agosto 2026

Orari prenotabili:
- dalle 19:30 alle 21:30

Capienza:
- massimo 80 coperti per giornata
- quando una giornata raggiunge 80 persone prenotate, risulta sold out: non e selezionabile e viene mostrata in rosso nel calendario

## 3. Sistema ruoli utenti

Admin:
- solo le due email definite in `ADMIN_EMAILS` dentro `public/app.js` e ripetute in `firestore.rules`;
- possono modificare/eliminare prenotazioni;
- possono aggiungere prenotazioni telefoniche;
- possono modificare disponibilita giornaliera;
- possono accedere a impostazioni operative.

Visualizzatori:
- tutti gli utenti che accedono con la password staff condivisa;
- possono vedere prenotazioni, disponibilita e riepiloghi;
- non vedono comandi di modifica;
- non possono creare, modificare o eliminare dati.

## 4. Flussi utente

Cliente:
1. Apre la home.
2. Vede logo e pulsante grande "Prenota ora".
3. Inserisce nome, telefono, data, orario e persone.
4. Decide se comunicare gia il menu.
5. Invia la prenotazione.
6. Riceve conferma oppure il messaggio "POSTI ESAURITI - PRENOTAZIONI SOLD OUT".

Staff admin:
1. Apre `/admin`.
2. Accede con email e password.
3. Vede prenotazioni di oggi, future e riepilogo prodotti.
4. Imposta disponibilita giornaliera.
5. Inserisce eventuali prenotazioni telefoniche.
6. Modifica o cancella prenotazioni se necessario.

Staff visualizzatore:
1. Apre `/admin`.
2. Accede con email e password.
3. Consulta prenotazioni e riepiloghi senza pulsanti di modifica.

## 5. Wireframe schermate principali

Home mobile:
```text
+--------------------------+
|        LOGO TONDO        |
| Le Cantine Vicolo...     |
| [ PRENOTA ORA ]          |
+--------------------------+
| MENU                     |
| [foto] Tagliere Castello |
| [foto] Tagliere Le Prata |
| [foto] Panino Prosciutto |
| [foto] Panino Porchetta  |
+--------------------------+
| DOVE SIAMO               |
| Indirizzo                |
| [ mappa ]                |
| [ Apri navigazione ]     |
+--------------------------+
| CONTATTI                 |
+--------------------------+
```

Prenotazione:
```text
+--------------------------+
| Prenota un tavolo        |
| Nome e Cognome           |
| Telefono                 |
| Data | Orario            |
| Numero persone           |
| Vuoi comunicarci...?     |
| ( ) Sul posto            |
| ( ) Comunica scelta      |
| [+/- prodotti opzionali] |
| [ Conferma prenotazione ]|
+--------------------------+
```

Admin:
```text
+--------------------------+
| Login email/password     |
+--------------------------+
| Dashboard                |
| Oggi | Future | Prodotti |
| Disponibilita giornata   |
| Prenotazioni elenco      |
| [aggiungi telefonica]    |
+--------------------------+
```

## 6. Piano di sviluppo

1. Creare struttura statica e tema visivo coerente con il logo.
2. Implementare home, menu, mappa, contatti e CTA.
3. Implementare form prenotazione con scelta menu facoltativa.
4. Collegare Firebase Auth e Firestore.
5. Implementare controllo disponibilita per data.
6. Creare dashboard `/admin` con login.
7. Applicare ruoli admin/viewer in UI e regole.
8. Aggiungere gestione disponibilita e prenotazioni telefoniche.
9. Test manuale mobile e desktop.
10. Deploy su Firebase Hosting.

## Configurazione

1. Copiare `public/firebase-config.example.js` in `public/firebase-config.js`.
2. Inserire i dati del progetto Firebase.
3. In `public/app.js` compilare:
   - `ADMIN_EMAILS`
   - `STAFF_PASSWORD`
   - indirizzo
   - telefoni
   - URL Google Maps.
4. In `firestore.rules` mantenere sincronizzate le stesse due email admin reali.
5. Creare gli utenti staff in Firebase Authentication.
6. Pubblicare con Firebase Hosting.
