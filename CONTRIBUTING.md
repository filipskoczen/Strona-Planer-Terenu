# Przewodnik Współtworzenia - Land Planner

Dziękujemy za zainteresowanie współtworzeniem Land Planner! 🎉

## 📋 Kodeks Postępowania

- Bądź uprzejmy i poszanuj wszystkich współtwórców
- Unikaj języka obraźliwego
- Otwartość na różne perspektywy
- Skupienie się na konstruktywnej krytyce

## 🐛 Raportowanie Bugów

Znalazłeś błąd? Zgłoś go!

### Jak zgłosić
1. Sprawdź czy bug nie został już zgłoszony
2. Opisz problem jasno i zwięźle
3. Podaj kroki do reprodukcji
4. Dołącz screenshot (jeśli dotyczy)
5. Wymień przeglądarki testowane

### Szablon Raportu
```
Tytuł: [Krótki opis]

Opisanie:
[Szczegółowy opis problemu]

Kroki do reprodukcji:
1. ...
2. ...
3. ...

Spodziewane zachowanie:
[Co miało się stać]

Faktyczne zachowanie:
[Co się faktycznie działo]

Środowisko:
- Przeglądarka: Chrome 120
- OS: Windows 11
- Wersja: 1.0.0
```

## ✨ Sugestie Funkcji

Masz ciekawy pomysł? Podziel się!

### Jak zaproponować
1. Sprawdź czy pomysł nie istnieje już
2. Opisz use case (jak będzie używana)
3. Wyjaśnij korzyści
4. Zasugeruj implementację (opcjonalnie)

## 🔧 Development Setup

### Wymagania
- Node.js 14+ (dla przyszłych wersji)
- Nowoczesna przeglądarka
- Git

### Instalacja
```bash
git clone <repository-url>
cd land-planner
# Otwórz index.html w przeglądarce
```

## 💻 Kontrybuowanie Kodu

### Przed Zaproponowaniem PR
1. **Fork** repo
2. **Clone** lokalnie
3. **Branch** - utwórz feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```

### Style Kodowania
- **JavaScript**: ES6+, camelCase
- **CSS**: BEM naming convention
- **Komentarze**: JSDoc dla funkcji publicznych
- **Formatowanie**: 4 spacje indentacji

### Struktura Plików
```
js/
├── app.js           # Główny punkt wejścia
├── manager/         # Business logic
├── models/          # Data models
└── utils/           # Helper functions
```

### Code Review
Umożliwiamy review przed merge:
1. Minimum 1 approval
2. Wszystkie testy muszą przejść
3. Brak merge conflicts

## 📝 Pull Request

### PR Template
```markdown
## Opis Zmian
[Krótki opis zmian]

## Typ Zmiany
- [ ] Bug fix
- [ ] Nowa feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Testowane na przeglądarce X
- [ ] Testowane na rezolucji Y
- [ ] Brak regressions

## Checklist
- [ ] Code follows style guidelines
- [ ] No console errors/warnings
- [ ] Updated documentation
- [ ] Tested thoroughly
```

## 📚 Dokumentacja

Każda nowa feature powinna mieć dokumentację:

### Code Comments
```javascript
/**
 * Dodaj element do projektu
 * @param {string} type - Typ elementu
 * @param {number} x - Pozycja X
 * @param {number} y - Pozycja Y
 * @returns {Element} Dodany element
 */
function addElement(type, x, y) {
  // ...
}
```

### README Updates
- Zaktualizuj README.md jeśli dodajesz feature
- Dodaj do sekcji Features
- Aktualizuj Changelog

## 🎨 Design Guide

### Kolory
```css
--primary: #6366f1      /* Indygo */
--success: #10b981      /* Zielony */
--danger: #ef4444       /* Czerwony */
--warning: #f59e0b      /* Pomarańczowy */
```

### Typography
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
font-size: 16px (base)
line-height: 1.5
```

### Spacing
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

## 🧪 Testing

### Manual Testing
1. Testuj na rzeczywistych danych
2. Różne przeglądarki
3. Różne rozdzielczości (desktop, tablet)
4. Keyboard navigation
5. Performance testing

### Scenariusze
- Tworzenie projektu
- Dodawanie elementów
- Edycja właściwości
- Undo/Redo
- Export/Import
- LocalStorage

## 📦 Release Process

### Versioning
Używamy Semantic Versioning (MAJOR.MINOR.PATCH)
- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Checklist Releaseu
- [ ] Wszystkie testy przechodzą
- [ ] Documentation jest aktualna
- [ ] CHANGELOG zaktualizowany
- [ ] Version number updated
- [ ] Tag git creation

## 🤝 Komunikacja

### Forum
- GitHub Issues: Bugs i Features
- Discussions: General questions

### Odpowiadanie
Staramy się odpowiedzieć w ciągu 48 godzin.

## 🎓 Learning Resources

- [Konva.js Docs](https://konvajs.org/)
- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/)
- [CSS Tricks](https://css-tricks.com/)
- [Web Accessibility](https://www.w3.org/WAI/)

## 📄 Licencja

Poprzez wkład, zgadzasz się że Twój kod będzie pod licencją MIT.

## 🙏 Dziękujemy!

Dziękujemy za każdy wkład - czy to raport błąd, suggestion czy PR! Land Planner rośnie dzięki wam. 🌿

---

**Happy Contributing! 🚀**
