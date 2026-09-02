# Qué Se Viene

Agenda de facultad con cuenta regresiva a cada parcial, entrega y trámite.
Los datos viven en **Firebase Realtime Database** (proyecto `WidgetFacu`) y
se sincronizan en tiempo real entre el celular y la compu.

- **Celular / navegador:** esta web (GitHub Pages). Se puede "instalar" como app.
- **Escritorio (Windows):** widget flotante siempre visible → carpeta `../Que Se Viene`.

Ambos usan exactamente los mismos datos.

---

## Puesta en marcha (una sola vez)

### 1. Reglas y dominio en Firebase
Seguí `REGLAS-firebase.txt`:
- agregar el bloque `agenda` a las reglas de Realtime Database
- agregar `franciscorodriguez-hue.github.io` a los dominios autorizados de Authentication

### 2. Publicar la web en GitHub Pages
```bash
cd "C:\Users\Francisco\Desktop\agenda-facultad"
git init
git add .
git commit -m "Agenda con cuenta regresiva"
git branch -M main
git remote add origin https://github.com/franciscorodriguez-hue/agenda-facultad.git
git push -u origin main
```
Después, en GitHub: **Settings → Pages → Source: `main` / `/ (root)`**.
En ~1 minuto queda en:

    https://franciscorodriguez-hue.github.io/agenda-facultad/

(Si usás otro nombre de repo, cambialo también en `REGLAS-firebase.txt`,
en `manifest.webmanifest` no hace falta, y en `../Que Se Viene/config.json`.)

### 3. En el celular
Abrí esa URL con Chrome → menú → **"Agregar a la pantalla principal"**.
Entrá con tu cuenta de Google.

### 4. En la compu
Carpeta `../Que Se Viene` → doble clic en **`Iniciar widget.vbs`**.
La primera vez, en la ventana de gestión, **Entrar con Google** (la misma cuenta).

---

## Archivos

| archivo | qué es |
|---|---|
| `index.html` | app completa: alta, edición, filtros, cuenta regresiva |
| `widget.html` | vista compacta (la usa el widget de escritorio) |
| `app.js` | Firebase + lógica compartida |
| `styles.css` | estilos compartidos |
| `sw.js` + `manifest.webmanifest` | para instalarla como app / abrir offline |
| `REGLAS-firebase.txt` | reglas de seguridad y dominios a configurar |

## Datos

`Realtime Database → agenda/<tu-uid>/eventos/<id>`
Cada evento: `titulo, materia, tipo, fecha, prioridad, notas, createdAt, updatedAt`.
