# Notus - Projekt Dyplomowy

Aplikacja kliencka do zarządzania obecnością i procesem dydaktycznym na uczelni (PJATK). Główny projekt frontendowy zbudowany z wykorzystaniem nowoczesnych narzędzi internetowych.

## Technologie

Główne technologie wykorzystane w projekcie to:
- **React 18** z frameworkiem **Vite** dla błyskawicznych czasów renderowania i budowania.
- **Clerk** do procesów uwierzytelniania użytkowników (np. logowanie Google).
- **React Router** do nawigacji po stronie klienckiej.
- **Capacitor** do przyszłego obudowania aplikacji i dostarczenia jej na platformy mobilne (Android/iOS).

## Struktura Katalogów

Projekt przeszedł gruntowną restrukturyzację dla lepszej przejrzystości:
```text
src/
├── config/        # Pliki konfiguracyjne
├── context/       # Globalne konteksty dla React (np. uwierzytelnianie)
├── pages/         # Główne "ekrany" aplikacji
│   ├── global/    # Widoki wspólne (np. Logowanie, Profil)
│   ├── student/   # Widoki dedykowane dla roli studenta (np. Skaner QR)
│   └── teacher/   # Widoki dedykowane dla roli nauczyciela (np. Tworzenie sesji)
├── services/      # Serwisy oddelegowane do komunikacji z API i operacji asynchronicznych
├── styles/        # Globalne i reużywalne style i motywy
├── App.jsx        # Główny router kierujący odpowiednie komponenty do domeny użytkowników
└── main.jsx       # Globalny główny punkt wejścia
```

## Uruchomienie lokalne

1. Zanistaluj niezbędne paczki z użyciem menedżera npm:
```bash
npm install
```

2. Uruchom serwer deweloperski, który domyślnie uruchomi się używając wtyczki modułu Vite:
```bash
npm run dev
```

3. (Opcjonalnie) Zbuduj wersję produkcyjną
```bash
npm run build
```

## Podział na role w projekcie
Podstawowy kod zakłada testowy podział autoryzacyjny pomiędzy `studentem` (adresy e-mail zaczynające się na 's') a `nauczycielem`. Obie te role uzyskują dostęp do dedykowanych dashboardów.
