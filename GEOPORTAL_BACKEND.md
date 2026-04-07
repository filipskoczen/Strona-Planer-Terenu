# 🌳 Geoportal Backend Proxy - Instrukcja

## 📋 Wymagania

- Node.js 14+ 
- npm (zwykle dochodzi z Node.js)

## ⚙️ Instalacja

Zależności są już zainstalowane. Jeśli potrzebujesz ponownie zainstalować:

```bash
npm install
```

## 🚀 Uruchomienie serwera

### Development (Rekomendowane)

```bash
npm run dev
```

Serwer uruchomi się na `http://localhost:3001`  
Automatycznie restartuje się przy zmianach w kodzie (dzięki nodemon)

### Production

```bash
npm start
```

## API Endpoints

### 1. POST /api/search
Szukaparceli po kodzie TERYT i numerze działki

**Request:**
```json
{
  "voivodeship": "14",
  "district": "20",
  "commune": "12",
  "plotNumber": "162"
}
```

**Response:**
```json
{
  "type": "Feature",
  "properties": {
    "nr_dzialki": "162",
    "pole_pow": 53980,
    "obreb": "WROSKA",
    "je_sop_kod": "142012"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  }
}
```

### 2. GET /api/health
Sprawdzenie statusu serwera

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-04-06T12:00:00Z"
}
```

## 🔗 Integracja z frontendem

Aplikacja automatycznie spróbuje połączyć się z serwerem proxy na `http://localhost:3001`

Jeśli serwer nie jest dostępny:
- ✅ Przechodzi na publiczne API Geoportalu (może mieć CORS issues)
- ✅ Pokazuje ostrzeżenie "API niedostępne - używam PRZYKŁADOWĄ działkę"

## 📌 Ważne

**Aby system pracował 1:1 z rzeczywistymi wymiarami:**

1. Uruchom serwer proxy:   ```bash
   npm start
   ```

2. Otwórz aplikację w przeglądarce (ta sama maszyna)

3. Importuj plik Excel/GeoJSON z Geoportalu

4. Działka zostanie wyświetlona z rzeczywistymi wymiarami w skali 1:1

## 🐛 Troubleshooting

### "Cannot GET /api/search"
- Sprawdź czy serwer jest uruchomiony (`npm start`)
- Sprawdź czy port 3001 nie jest zajęty
- Zmień port w `server.js` jeśli potrzeba

### "API niedostępne - używam PRZYKŁADOWĄ działkę"
- Serwer proxy  nie odpowiada
- Sprawdź konsolę przeglądarki (F12 → Console)
- Sprawdź logs serwera

### Działka się nie renderuje
- Sprawdź czy geometry jest w formacie GeoJSON Polygon
- Sprawdź konsolę przeglądarki (F12) na błędy
- Spróbuj z testowym plotem z przykładowych danych

## 📊 Formaty obsługiwane

- **TERYT codes**: 2+2+2 cyfry (województwo-powiat-gmina)
- **Geometry**: Polygon, MultiPolygon, Point, LineString
- **Coordinate system**: EPSG:2180 (polski układ warszawski)
- **Output**: Pixe ls 1:1 = 1 meter

## 📝 Logs

Server loguje:
- Wszystkie żądania (`METHOD /path`)
- Starty queryów (`📍 Querying parcel...`)
- Sukcesy (`✅ Parcel found`)
- Błędy (`❌ Error...`)

## 🛠 Zaawansowane

### Zmiana portu

Edytuj `server.js`:
```javascript
const PORT = process.env.PORT || 3001;  // Zmień 3001 na inną liczbę
```

Lub ustaw zmienną środowiskową:
```bash
PORT=3002 npm start
```

### Zmiana Geoportalu API

W `server.js` zmień `WFS_URL` i `API_BASE`.

Aktualnie używane:
- WFS: `https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracja`
- REST: `https://integracja.gugik.gov.pl`

## ✅ Status integracji

- ✅ WFS queries do Geoportalu
- ✅ REST API fallback
- ✅ CORS proxy
- ✅ Error handling
- ✅ Real-time coordinate conversion
- ✅ 1:1 scale rendering
- ✅ Property extraction

---

**Pytania?** Sprawdź dokumentację w `GEOPORTAL_IMPORT_FEATURE.md`
