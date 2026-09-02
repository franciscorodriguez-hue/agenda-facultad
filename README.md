# Qué Se Viene

Agenda de facultad con cuenta regresiva a cada parcial, entrega y trámite.
Los datos viven en **Firebase Realtime Database** (proyecto `WidgetFacu`) y se
sincronizan en tiempo real entre el celular y la compu.

- **App (celular / navegador):** https://widgetfacu.web.app  → se puede "instalar".
- **Widget de escritorio (Windows):** carpeta `../Que Se Viene` (ventana flotante).

Ambos usan los mismos datos y el mismo login.

---

## Deploy (Firebase Hosting)

La app se sirve desde Firebase Hosting para que el login con Google funcione
sin problemas de COOP / cookies (mismo dominio que el handler de auth).

```bash
cd "C:\Users\Francisco\Desktop\agenda-facultad"
npx -y firebase-tools login          # autoriza con tu cuenta Google (una vez)
npx -y firebase-tools deploy --only hosting
```

Queda en **https://widgetfacu.web.app** (y también `widgetfacu.firebaseapp.com`).

Para actualizar después de cambiar algo: repetir el `deploy`.
El repo de GitHub queda como copia del código:
```bash
git add . && git commit -m "cambios" && git push
```

---

## Configuración Firebase (ya hecha)

- Realtime Database creada (us-central1), reglas en `REGLAS-firebase.txt`
- Authentication → Google habilitado
- `widgetfacu.web.app` y `widgetfacu.firebaseapp.com` están autorizados por defecto

---

## Archivos

| archivo | qué es |
|---|---|
| `index.html` | app completa: alta, edición, filtros, cuenta regresiva |
| `widget.html` | vista compacta (la usa el widget de escritorio) |
| `app.js` | Firebase + lógica compartida |
| `styles.css` | estilos compartidos |
| `sw.js` + `manifest.webmanifest` | instalar como app / abrir offline |
| `firebase.json` / `.firebaserc` | config de Firebase Hosting |
| `REGLAS-firebase.txt` | reglas de la base de datos |

## Datos

`Realtime Database → agenda/<tu-uid>/eventos/<id>`
Cada evento: `titulo, materia, tipo, fecha, prioridad, notas, createdAt, updatedAt`.
