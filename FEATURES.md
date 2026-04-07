# Szczegółowe Funkcje - Land Planner 1.0

## 📦 Pakiet Pełnych Funkcji

### 1️⃣ TWORZENIE DZIAŁKI

#### Parametry Projektu
- **Szerokość** (5-500 m): Podaj szerokość działki
- **Długość** (5-500 m): Podaj długość działki
- **Siatka** (0.5-10 m): Rozmiar siatki dla precyzji
- **Nazwa**: Własna nazwa projektu

#### Wizualizacja
- Prostokąt działki zaznaczony niebieską linią
- Automatyczna siatka w tłe (szara, przezroczysta)
- Etykiety wymiarów na bokach
- Proporcje rzeczywiste (1 metr = X pikseli)

---

### 2️⃣ ELEMENTY - 11 TYPÓW

#### 🏠 DOM
- **Domyślne wymiary**: 10m × 12m
- **Domyślny kolor**: Czerwony (#ef4444)
- **Zastosowanie**: Główny budynek mieszkalny
- **Edycja**: Wszystkie parametry

#### 🛠️ GARAŻ
- **Domyślne wymiary**: 6m × 7m
- **Domyślny kolor**: Pomarańczowy (#f97316)
- **Zastosowanie**: Garaż dla pojazdów
- **Edycja**: Wszystkie parametry

#### 🌾 OGRÓD
- **Domyślne wymiary**: 8m × 8m
- **Domyślny kolor**: Zielony (#10b981)
- **Zastosowanie**: Obszar uprawy
- **Edycja**: Wszystkie parametry

#### 🌲 DRZEWO
- **Domyślne wymiary**: 2m × 2m
- **Domyślny kolor**: Ciemny zielony (#059669)
- **Zastosowanie**: Pojedyncze drzewo
- **Edycja**: Wszystkie parametry

#### 🌸 RABATA
- **Domyślne wymiary**: 4m × 4m
- **Domyślny kolor**: Różowy (#ec4899)
- **Zastosowanie**: Rabata kwiatów
- **Edycja**: Wszystkie parametry

#### 💧 JEZIORKO
- **Domyślne wymiary**: 6m × 6m
- **Domyślny kolor**: Błękitny (#0ea5e9)
- **Zastosowanie**: Zbiornik wodny / basen
- **Edycja**: Wszystkie parametry

#### 🚶 ŚCIEŻKA
- **Domyślne wymiary**: 2m × 10m
- **Domyślny kolor**: Szaro-brązowy (#78716c)
- **Zastosowanie**: Ścieżka spacerowa
- **Edycja**: Wszystkie parametry

#### 🚗 PODJAZD
- **Domyślne wymiary**: 4m × 15m
- **Domyślny kolor**: Szaro-stalowy (#64748b)
- **Zastosowanie**: Podjazd dla samochodów
- **Edycja**: Wszystkie parametry

#### 🔒 OGRODZENIE
- **Domyślne wymiary**: 0.3m × 20m
- **Domyślny kolor**: Fioletowy (#7c3aed)
- **Zastosowanie**: Ogrodzenie terenu
- **Edycja**: Wszystkie parametry
- **Wskazówka**: Od razu oznacza granicę

#### 🪑 ŁAWKA
- **Domyślne wymiary**: 1.5m × 1.5m
- **Domyślny kolor**: Brązowy (#a16207)
- **Zastosowanie**: Ławka do siedzenia
- **Edycja**: Wszystkie parametry

#### 💡 OŚWIETLENIE
- **Domyślne wymiary**: 0.5m × 0.5m
- **Domyślny kolor**: Żółty (#fbbf24)
- **Zastosowanie**: Lampa/oświetlenie
- **Edycja**: Wszystkie parametry
- **Wskazówka**: Mały rozmiar, umieszczaj punktowo

---

### 3️⃣ DRAG & DROP EDYTOR

#### Dodawanie Elementów
1. **Metoda 1**: Przeciągnij z panelu na kanwę
2. **Metoda 2**: Kliknij przycisk, a potem kliknij na kanwie gdzie chcesz

#### Przesuwanie
- Kliknij na element, aby go wybrać (zmieni się kolor na żółty)
- Przeciągnij na nową pozycję
- **Auto-snap**: Element przychyli się do najbliższej linii siatki
- Pozycja wyświetla się w metrach

#### Skalowanie
- Edytuj szerokość i wysokość w panelu właściwości
- Lub użyj slider'ów dla precyzji
- Element automatycznie zmieni rozmiar na kanwie

#### Obracanie
- Suwak "Obrót" (0-360°)
- Zmienia kąt elementu na kanwie
- Idealne dla ogrodzenia, ścieżek itp.

#### Kolorowanie
- Kolor selector w panelu właściwości
- Wybierz dowolny kolor z palety
- Etykieta elementu zmienia kolor automatycznie (kontrast)

#### Usuwanie
- Zaznacz element
- Kliknij przycisk "Usuń" lub wciśnij Delete
- Potwierdzenie dla uniknięcia przypadkowego usunięcia

---

### 4️⃣ PANEL WŁAŚCIWOŚCI (Prawy)

#### Informacje Elementu
- **Nazwa**: Edytowalna, max 50 znaków
- **Typ**: Wyświetlany, bez edycji
- **Pozycja**: X i Y w metrach (read-only)

#### Edycja Rozmiarów
- **Szerokość** (1-100m): Input z spinnerami
- **Długość** (1-100m): Input z spinnerami

#### Transformacje
- **Obrót** (0-360°): Slider
- **Przezroczystość** (0-100%): Slider

#### Kolory i Style
- **Kolor**: Color picker
- Kontrast tekstu zmienia się automatycznie

#### Akcje
- **Zablokuj/Odblokuj**: Uniemożliwić przesuwanie
- **Usuń**: Usunąć element z projektu

#### Odświeżanie
- Zmienia się w rzeczywistym czasie
- Nie wymagane kliknięcie "Potwierdź"

---

### 5️⃣ TOOLBAR I MENU

#### Nowy Projekt
- Otwiera modal z parametrami
- Czy chcesz zapisać poprzedni? (nie wymagane)
- Czyszcza poprzedni projekt

#### Zapisz Projekt
- Automatycznie zapisuje do localStorage
- Timeout: 1 sekunda
- Powiadomienie o sukcesie/błędzie

#### Wczytaj Projekt
- Wyświetla listę wszystkich projektów
- Pokazuje datę i liczbę elementów
- Kliknij, aby wczytać

#### Cofnij (Undo)
- Cofnij ostatnią zmianę
- Limit: 100 stanów
- Skrót: Ctrl+Z

#### Ponów (Redo)
- Przywróć wycofaną zmianę
- Limit: 100 stanów
- Skrót: Ctrl+Y

#### Powiększ/Zmniejsz
- Guziki + i -
- Lub Ctrl+Scroll
- Zoom: 10%-500%

#### Dopasuj Widok
- Automatyczne fit do całego projektu
- Idealnie wycentrowane
- Zoom dostosowuje się

#### Reset Widoku
- Powrót do widoku domyślnego
- Zoom: 100%
- Pozycja: (0, 0)

---

### 6️⃣ SIATKA I PRECYZJA

#### Siatka Wizualna
- Przerywane linie szare
- Przezroczystość 30%
- Rozmiar zależy od ustawień

#### Snap to Grid
- Automatyczne przyciąganie elementów
- Pracuje podczas przeciągania
- Można wyłączyć (przyszła wersja)

#### Wymiary
- Każdy element pokazuje wymiary
- Format: "10.5m × 12.0m"
- Aktualizuje się w real-time

#### Współrzędne
- Lewy dolny róg wyświetla X i Y
- Aktualizuje się podczas ruchu myszki
- Format: "X: 5.5m | Y: 10.2m | Zoom: 150%"

---

### 7️⃣ WARSTWY (LAYERS)

#### Lista Elementów
- Wyświetla wszystkie elementy w projekcie
- Ikona + nazwa każdego elementu
- Zaznaczenie wskazuje aktualnie wybrany

#### Widoczność
- Ikona oka obok każdego elementu
- Kliknij, aby pokazać/ukryć
- Ukryta warstwa nie jest renderowana
- Nie uczestniczy w export

#### Interakcja
- Kliknij element na liście, aby go wybrać
- Otwiera panel właściwości
- Zaznacz na kanwie lub w liście - obie metody działają

#### Porządek
- Elementy są renderowane w kolejności dodania
- Ostatnie dodane są na vrchu
- (Przyszła wersja: drag to reorder)

---

### 8️⃣ HISTORIA ZMIAN (Undo/Redo)

#### Obsługiwane Akcje
- ✅ Dodanie elementu
- ✅ Usunięcie elementu
- ✅ Przesunięcie elementu
- ✅ Zmiana rozmiaru
- ✅ Zmiana koloru
- ✅ Zmiana nazwy
- ✅ Zmiana obrotu
- ✅ Zmiana przezroczystości

#### Limit
- Do 100 ostatnich zmian
- Starsze zmiany są usuwane
- Pojemna historia dla projektów

#### Klawiatura
- **Ctrl+Z**: Cofnij (Windows/Linux)
- **Cmd+Z**: Cofnij (Mac)
- **Ctrl+Y** / **Shift+Ctrl+Z**: Ponów
- **Cmd+Y** / **Shift+Cmd+Z**: Ponów (Mac)

---

### 9️⃣ EXPORT I ZAPIS

#### Automatyczny Zapis
- **LocalStorage**: Co zmianie
- **Interval**: Co ~5 sekund
- **Bezpieczeństwo**: Cały projekt szyfrowany w localStorage

#### Eksport PNG
- **Format**: PNG (24-bit)
- **Jakość**: Oryginalna rozdzielczość
- **Użytkownik**: Pobiera się automatycznie
- **Nazewnictwo**: `plan-{nazwa}-{timestamp}.png`

#### Eksport JSON
- **Format**: JSON (formatted)
- **Zawartość**: Pełne dane projektu
- **Użytkownik**: Pobiera się automatycznie
- **Nazewnictwo**: `project-{nazwa}-{timestamp}.json`

#### Import JSON
- Wczytaj wcześniej wyeksportowany plik
- Validacja danych
- Przywróci wszystkie elementy i ustawienia

#### LocalStorage
- **Limit**: ~5-10 MB na stronę
- **Przezroczystość**: Wszystkie dane w czystym tekście
- **Usunięcie**: Wyczyść historię przeglądarki

---

### 🔟 INTERFEJS UŻYTKOWNIKA

#### Motyw
- **Ciemny**: Przyjemny dla oczu
- **Kolory**: Indigo, Purpura, Zielony, Błękitny
- **Kontrast**: WCAG AA

#### Layout
- **Sidebar Lewy**: Narzędzia i elementy
- **Kanwa**: Główny obszar edycji
- **Panel Prawy**: Właściwości elementu

#### Responsywność
- **Desktop**: Pełny layout (3 kolumny)
- **Tablet**: Zoptymalizowany (2 kolumny)
- **Mobile**: Pełny ekran (sidebarami do ukrycia)

#### Animacje
- **Gładkie**: Transition 150-300ms
- **Zoom**: Inertial scrolling
- **Toasty**: Powiadomienia z animacją

#### Dostępność
- **Keyboard**: Wszystkie funkcje dostępne
- **ARIA**: Etykiety dla screen readerów
- **Kontrast**: Spełnia WCAG AA

---

### 🔐 BEZPIECZEŃSTWO

#### XSS Protection
- Sanitizacja wszystkich inputów użytkownika
- Brak innerHTML dla danych użytkownika
- Escape specjalnych znaków

#### Validacja Danych
- Liczby: Min/Max limity
- Strings: Długość Max
- Kolory: Format HEX validation
- Typy: Białe listy dla elementów

#### Safe JSON
- Bezpieczne parsowanie JSON
- Try-catch dla błędów
- Fallback wartości

#### Bezpieczne DOM
- textContent zamiast innerHTML
- setAttribute zamiast bezpośredniej manipulacji
- Event delegation dla dynamicznych elementów

---

### ⚡ OPTYMALIZACJA

#### Canvas Rendering
- **Konva.js**: Optimized WebGL/Canvas
- **Batching**: Grupowanie aktualizacji
- **Layers**: Oddzielne renderowanie

#### Performance
- **Throttling**: Mouse events maksymalnie co 16ms
- **Debouncing**: Resize events z opóźnieniem
- **Caching**: Elementy zapamiętane

#### Limity
- **Elementy**: Testowane do 1000+
- **Rozdzielczość**: Do 2560×1440px
- **Zoom**: 10%-500% bez degradacji

---

### 📱 SKRÓTY KLAWISZOWE

| Klawisz | Akcja | Notatka |
|---------|-------|---------|
| **Ctrl+Z** | Cofnij | Windows/Linux |
| **Cmd+Z** | Cofnij | Mac |
| **Ctrl+Y** | Ponów | Windows/Linux |
| **Cmd+Y** | Ponów | Mac |
| **Shift+Ctrl+Z** | Ponów | Alternatywa |
| **Shift+Cmd+Z** | Ponów | Mac Alternatywa |
| **Ctrl++** | Powiększ | Windows/Linux |
| **Cmd++** | Powiększ | Mac |
| **Ctrl+-** | Zmniejsz | Windows/Linux |
| **Cmd+-** | Zmniejsz | Mac |
| **Delete** | Usuń Element | Po zaznaczeniu |
| **Scroll** | Zoom | Na kanwie |
| **Drag** | Przesuń Kanwę | Na kanwie |

---

## 🎓 Porady i Triki

1. **Szybkie Tworzenie**: Przeciągnij element kilka razy szybko
2. **Precyzja**: Używaj siatki do wyrównania
3. **Orientacja**: Obróć elementy liniowe (ogrodzenie, ścieżki)
4. **Kolory**: Używaj kontrastowych kolorów dla jasności
5. **Backup**: Regularnie eksportuj do JSON
6. **Zoom**: Zoom out, aby widzieć cały projekt
7. **Ukrywanie**: Ukryj warstwy, aby zmniejszić bałagan
8. **Nazwy**: Daj znaczące nazwy elementom (Dom główny, Garaż itp.)

---

**Enjoy Planning! 🌿 Land Planner v1.0.0**
