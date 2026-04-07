# 🚀 Quick Start - Land Planner

## ⚡ 5 Minut do Pierwszego Planu Działki

### Krok 1: Otwórz Aplikację
1. Pobierz wszystkie pliki
2. Kliknij zaraz na `index.html`
3. Poczekaj ~2 sekundy na załadowanie

### Krok 2: Utwórz Nowy Projekt
```
┌─────────────────────────────────┐
│  Nowy Projekt                   │
├─────────────────────────────────┤
│ Szerokość działki: 30 metrów    │
│ Długość działki  : 40 metrów    │
│ Rozmiar siatki   : 1 metr       │
│ Nazwa projektu   : Moja działka │
├─────────────────────────────────┤
│ [Anuluj] [UTWÓRZ]               │
└─────────────────────────────────┘
```

### Krok 3: Dodaj Elementy

#### Metoda 1: Drag & Drop (Najszybciej!)
```
1. Patrz na lewy panel
2. Kliknij i przeciągnij "🏠 Dom" na kanwę
3. Upuść element gdzie chcesz
```

#### Metoda 2: Click & Place
```
1. Kliknij przycisk "🏠 Dom"
2. Kliknij na kanwie gdzie chcesz umieścić
3. Element pojawi się tam
```

### Krok 4: Edytuj Element
```
1. Kliknij element na kanwie
2. Prawy panel się otworzy
3. Zmień: wielkość, kolor, obrót
4. Zmiany będą natychmiast widoczne
```

### Krok 5: Zapisz i Eksportuj
```
Zapisz:
1. Kliknij "💾 Zapisz" - projekt zapisze się w przeglądarce

Eksportuj jako PNG (do druku):
1. Narzędzia (górny prawy róg)
2. Kliknij "🖼️ Eksport jako PNG"
3. Obraz pobierze się do folderu

Eksportuj jako JSON (backup):
1. Narzędzia (górny prawy róg)
2. Kliknij "📄 Eksport jako JSON"
3. Plik JSON pobierze się do folderu
```

---

## 🎯 Szybkie Cykl Pracy

### 1. Przesuwanie Elementu
```
1. Kliknij element (zmieni się na żółty)
2. Przeciągnij myszką
3. Element przichyli się do siatki
4. Upuść - gotowe!
```

### 2. Zmiana Rozmiaru
```
1. Zaznacz element (prawy panel)
2. Zmień "Szerokość" i "Długość"
3. Element zmieni rozmiar natychmiast
```

### 3. Zmiana Koloru
```
1. Zaznacz element (prawy panel)
2. Kliknij na "Kolor"
3. Wybierz z palety
4. OK!
```

### 4. Usuwanie
```
1. Zaznacz element
2. Kliknij "Usuń" (prawy panel)
3. Potwierdź
4. Gotowe!
```

### 5. Cofnięcie (Jeśli Ci się nie spodobało)
```
Ctrl+Z (Windows/Linux) lub Cmd+Z (Mac)
```

---

## 🎨 Elementy - Szybki Przegląd

| Ikona | Nazwa | Domyślnie |
|-------|-------|----------|
| 🏠 | Dom | 10m × 12m |
| 🛠️ | Garaż | 6m × 7m |
| 🌾 | Ogród | 8m × 8m |
| 🌲 | Drzewo | 2m × 2m |
| 🌸 | Rabata | 4m × 4m |
| 💧 | Jeziorko | 6m × 6m |
| 🚶 | Ścieżka | 2m × 10m |
| 🚗 | Podjazd | 4m × 15m |
| 🔒 | Ogrodzenie | 0.3m × 20m |
| 🪑 | Ławka | 1.5m × 1.5m |
| 💡 | Oświetlenie | 0.5m × 0.5m |

---

## 💡 Porady

### Tip 1: Różne Kolory
Elementy tego samego typu mogę mieć różne kolory!
```
Dom 1: Czerwony
Dom 2: Pomarańczowy
```

### Tip 2: Siatka Pomaga
Przyciągnięcie do siatki (snap) sprawia, że elementy są wyrównane.
Często wyłączaj zoom, aby zobaczyć całe obraz.

### Tip 3: Ukrywanie Elementów
Kliknij 👁️ obok elementu aby go ukryć (nie usuwać).
Idealnie gdy chcesz pracować na konkretnych warstwach.

### Tip 4: Backup
Eksportuj do JSON co jakiś czas - to Twój backup!

### Tip 5: Druk
Export do PNG daje wysoka rozdzielczość, idealną do druku A4.

---

## 🆘 Problemy?

### Problem: Nie mogę dodać elementu
**Rozwiązanie**: Najpierw utwórz projekt! Kliknij "Nowy".

### Problem: Element się nie zapisuje
**Rozwiązanie**: Kliknij "Zapisz" guzik na górze. LocalStorage zapamięta.

### Problem: Przeglądarką pokazuje błąd
**Rozwiązanie**: Otwórz Developer Tools (F12) i czytaj komunikaty błędów.

### Problem: Gdzie mój projekt?
**Rozwiązanie**: Wczytaj go poprzez guzik "Wczytaj". Jest w localStorage.

---

## 🎓 Przykłady Projektów

### Projekt 1: Dom Jednorodzinny
```
Wymiary działki: 25m × 35m

Elementy:
- 🏠 Dom (10m × 12m) - pozycja: 5m, 5m
- 🛠️ Garaż (6m × 6m) - pozycja: 16m, 5m
- 🌾 Ogród (6m × 15m) - pozycja: 5m, 18m
- 🚶 Ścieżka (1.5m × 8m) - obrót: 15°
- 🔒 Ogrodzenie - wokół peryferii
- 🪑 Ławka (2x)
- 🌲 Drzewa (kilka)
```

### Projekt 2: Mały Ogród
```
Wymiary działki: 15m × 20m

Elementy:
- 🌾 Ogród (10m × 12m) - centrum
- 🌸 Rabaty (4) - narożniki
- 🌲 Drzewa (3-4) - dekoracyjne
- 💧 Jeziorko (4m × 4m) - lewy róg
- 🚶 Ścieżka - midzy ogródami
- 🔒 Ogrodzenie - wokół terenu
```

### Projekt 3: Działka Komercyjna
```
Wymiary działki: 50m × 80m

Elementy:
- 🏠 Budynki (kilka)
- 🚗 Podjazdy
- 💡 Oświetlenie (punktowe)
- 🔒 Ogrodzenie zabezpieczające
- 🌲 Zeleń dekoracyjna
```

---

## 📚 Gdzie Dalej?

- Czytaj [FEATURES.md](./FEATURES.md) - pełny opis wszystko
- Czytaj [README.md](./README.md) - dokumentacja
- Czytaj [CONTRIBUTING.md](./CONTRIBUTING.md) - jeśli chcesz wspierać

---

## ✨ Gotowy?

1. Otwórz `index.html`
2. Utwórz projekt
3. Dodaj elementy
4. Ciesz się planowaniem! 🌿

---

**Happy Planning! 🚀 Land Planner v1.0.0**
