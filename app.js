/* ===== Qué Se Viene — núcleo compartido (Firebase + helpers) =====
   Lo usan index.html (gestión) y widget.html (widget de escritorio). */
(function () {
  "use strict";

  // Proyecto Firebase propio de la agenda (Realtime Database + Google).
  var firebaseConfig = {
    apiKey: "AIzaSyDh_QsUK498JLNZZ-M-2GI0V986vsl1wMU",
    // authDomain = mismo dominio donde se sirve la app (Firebase Hosting),
    // así el login con Google no choca con COOP / cookies de terceros.
    authDomain: "widgetfacu.web.app",
    databaseURL: "https://widgetfacu-default-rtdb.firebaseio.com",
    projectId: "widgetfacu",
    storageBucket: "widgetfacu.firebasestorage.app",
    messagingSenderId: "456925178569",
    appId: "1:456925178569:web:ad372438379c6517d53b18",
    measurementId: "G-8H0Z83WPNG"
  };

  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();
  var db = firebase.database();
  try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}

  var CACHE_KEY = "qsv:cache:v1";
  var uid = null;
  var subHandle = null;

  function eventosRef() {
    return db.ref("agenda/" + uid + "/eventos");
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function writeCache(list) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function snapToList(snap) {
    var val = snap.val() || {};
    return Object.keys(val).map(function (k) {
      var o = val[k] || {};
      o.id = k;
      return o;
    });
  }

  /* ---------- helpers de fecha / formato ---------- */
  var DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  var DIAS_C = ["dom","lun","mar","mié","jue","vie","sáb"];
  var MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function fmtWhen(d) {
    return DIAS_C[d.getDay()] + " " + d.getDate() + " " + MESES[d.getMonth()] +
      " · " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function parts(ms) {
    var a = Math.abs(ms);
    return {
      d: Math.floor(a / 86400000),
      h: Math.floor((a % 86400000) / 3600000),
      m: Math.floor((a % 3600000) / 60000),
      s: Math.floor((a % 60000) / 1000)
    };
  }
  function fmtShort(dl, now) {
    var ms = dl - now, p = parts(ms);
    if (ms < 0) {
      if (p.d === 0) return "venció hoy";
      if (p.d === 1) return "hace 1 día";
      return "hace " + p.d + " días";
    }
    if (p.d >= 1) return p.d + " d " + p.h + " h";
    if (p.h >= 1) return p.h + " h " + p.m + " m";
    return p.m + " m " + pad(p.s) + " s";
  }
  function fmtBig(dl, now) {
    var ms = dl - now, p = parts(ms);
    if (ms < 0) return p.d >= 1 ? "hace " + p.d + "d" : "venció";
    if (p.d >= 1) return p.d + "d " + p.h + "h " + pad(p.m) + "m";
    if (p.h >= 1) return p.h + "h " + pad(p.m) + "m " + pad(p.s) + "s";
    return p.m + "m " + pad(p.s) + "s";
  }
  function fmtMini(dl, now) {
    var ms = dl - now, p = parts(ms);
    if (ms < 0) return p.d >= 1 ? "-" + p.d + "d" : "venció";
    if (p.d >= 1) return p.d + "d " + p.h + "h";
    if (p.h >= 1) return p.h + "h " + p.m + "m";
    return p.m + "m " + pad(p.s) + "s";
  }
  function urgency(dl, now) {
    var ms = dl - now;
    if (ms < 0) return "overdue";
    var days = ms / 86400000;
    if (days <= 3) return "urgent";
    if (days <= 7) return "soon";
    return "far";
  }
  function materiaHue(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % 360;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c];
    });
  }
  function toLocalInput(v) {
    var d = new Date(v);
    if (isNaN(d)) return "";
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function newId() {
    return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- API pública ---------- */
  window.QSV = {
    isShell: !!window.qsvShell,

    onAuth: function (cb) {
      auth.onAuthStateChanged(function (u) {
        uid = u ? u.uid : null;
        cb(u);
      });
      // Completa un posible signInWithRedirect anterior.
      auth.getRedirectResult().catch(function () {});
    },

    signIn: function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return auth.signInWithPopup(provider).catch(function (err) {
        var code = err && err.code;
        if (code === "auth/popup-blocked" ||
            code === "auth/cancelled-popup-request" ||
            code === "auth/operation-not-supported-in-this-environment") {
          return auth.signInWithRedirect(provider);
        }
        throw err;
      });
    },

    signOut: function () { return auth.signOut(); },

    user: function () { return auth.currentUser; },

    /** Suscripción en vivo. Llama cb(list) ahora (con caché) y en cada cambio.
        Reemplaza cualquier suscripción anterior. */
    subscribe: function (cb) {
      if (subHandle) { try { subHandle(); } catch (e) {} subHandle = null; }
      cb(readCache());
      if (!uid) return function () {};
      var ref = eventosRef();
      var handler = ref.on("value", function (snap) {
        var list = snapToList(snap);
        writeCache(list);
        cb(list);
      }, function (err) {
        console.error("Firebase read error", err);
      });
      subHandle = function () { ref.off("value", handler); };
      return subHandle;
    },

    /** Alta o edición. id null/undefined => alta. Devuelve Promise. */
    put: function (id, data) {
      if (!uid) return Promise.reject(new Error("sin sesión"));
      var body = {
        titulo: data.titulo || "",
        materia: data.materia || "",
        tipo: data.tipo || "Otro",
        fecha: data.fecha || "",
        prioridad: data.prioridad || "media",
        notas: data.notas || "",
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      if (id) return db.ref("agenda/" + uid + "/eventos/" + id).set(body);
      return db.ref("agenda/" + uid + "/eventos/" + newId()).set(body);
    },

    remove: function (id) {
      if (!uid) return Promise.reject(new Error("sin sesión"));
      return db.ref("agenda/" + uid + "/eventos/" + id).remove();
    },

    cache: readCache,

    fmt: {
      DIAS: DIAS, DIAS_C: DIAS_C, MESES: MESES,
      pad: pad, capFirst: capFirst, esc: esc,
      fmtWhen: fmtWhen, parts: parts,
      fmtShort: fmtShort, fmtBig: fmtBig, fmtMini: fmtMini,
      urgency: urgency, materiaHue: materiaHue,
      toLocalInput: toLocalInput
    }
  };
})();
