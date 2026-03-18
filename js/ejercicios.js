// =============================================
// MÓDULO EJERCICIOS — TopLiderCoach HUB
// v2.0 — Pizarra táctica completa
// =============================================

// ---- COLORES DE EQUIPO ----
const EJ_TEAM_COLORS = {
    blue:      { fill: '#3b82f6', stroke: '#2563eb', name: 'Azul' },
    red:       { fill: '#ef4444', stroke: '#dc2626', name: 'Rojo' },
    yellow:    { fill: '#eab308', stroke: '#ca8a04', name: 'Amarillo' },
    white:     { fill: '#f8fafc', stroke: '#cbd5e1', name: 'Blanco' },
    black:     { fill: '#1e293b', stroke: '#0f172a', name: 'Negro' },
    green:     { fill: '#22c55e', stroke: '#16a34a', name: 'Verde' },
    orange:    { fill: '#f97316', stroke: '#ea580c', name: 'Naranja' },
    purple:    { fill: '#a855f7', stroke: '#9333ea', name: 'Morado' },
    atletico:  { fill: '#ef4444', fill2: '#ffffff', stroke: '#dc2626', name: 'Atlético', striped: true },
    barcelona: { fill: '#a855f7', fill2: '#dc2626', stroke: '#7c3aed', name: 'Barcelona', striped: true },
    milan:     { fill: '#ef4444', fill2: '#1e293b', stroke: '#dc2626', name: 'Milan',    striped: true },
    juventus:  { fill: '#ffffff', fill2: '#1e293b', stroke: '#cbd5e1', name: 'Juventus', striped: true },
    inter:     { fill: '#3b82f6', fill2: '#1e293b', stroke: '#2563eb', name: 'Inter',    striped: true }
};

// ---- FORMACIONES ----
const EJ_FORMATIONS = {
    '4-4-2': [{x:.06,y:.50},{x:.20,y:.15},{x:.20,y:.38},{x:.20,y:.62},{x:.20,y:.85},
              {x:.40,y:.15},{x:.40,y:.38},{x:.40,y:.62},{x:.40,y:.85},{x:.60,y:.35},{x:.60,y:.65}],
    '4-3-3': [{x:.06,y:.50},{x:.20,y:.15},{x:.20,y:.38},{x:.20,y:.62},{x:.20,y:.85},
              {x:.38,y:.30},{x:.38,y:.50},{x:.38,y:.70},{x:.58,y:.20},{x:.62,y:.50},{x:.58,y:.80}],
    '3-5-2': [{x:.06,y:.50},{x:.18,y:.25},{x:.18,y:.50},{x:.18,y:.75},
              {x:.35,y:.10},{x:.35,y:.35},{x:.35,y:.50},{x:.35,y:.65},{x:.35,y:.90},{x:.55,y:.35},{x:.55,y:.65}],
    '4-2-3-1':[{x:.06,y:.50},{x:.20,y:.15},{x:.20,y:.38},{x:.20,y:.62},{x:.20,y:.85},
               {x:.35,y:.35},{x:.35,y:.65},{x:.50,y:.15},{x:.50,y:.50},{x:.50,y:.85},{x:.65,y:.50}],
    '5-3-2': [{x:.06,y:.50},{x:.18,y:.10},{x:.18,y:.30},{x:.18,y:.50},{x:.18,y:.70},{x:.18,y:.90},
              {x:.38,y:.25},{x:.38,y:.50},{x:.38,y:.75},{x:.55,y:.35},{x:.55,y:.65}]
};

// ---- COLORES DE LÍNEA ----
const EJ_LINE_COLORS = [
    {c:'#ffffff',n:'Blanco'},{c:'#ef4444',n:'Rojo'},{c:'#3b82f6',n:'Azul'},{c:'#22c55e',n:'Verde'},
    {c:'#eab308',n:'Amarillo'},{c:'#f97316',n:'Naranja'},{c:'#a855f7',n:'Morado'},{c:'#000000',n:'Negro'}
];

// ---- IMÁGENES DE EQUIPAMIENTO (del proyecto FBT) ----


// ---- TIPOS DE EQUIPAMIENTO ----
const EJ_EQUIPMENT_TYPES = [
    { key: 'ball',       name: 'Balón',         w: 40, h: 43 },
    { key: 'cone',       name: 'Cono',           w: 36, h: 40 },
    { key: 'marker',     name: 'Marcador',       w: 36, h: 36 },
    { key: 'stickRed',   name: 'Pica Roja',      w: 28, h: 50 },
    { key: 'stickYellow',name: 'Pica Amarilla',  w: 28, h: 50 },
    { key: 'wall',       name: 'Barrera',        w: 40, h: 42 },
    { key: 'smallGoal',  name: 'Mini Portería',  w: 50, h: 42 },
    { key: 'goalSmall',  name: 'Portería S',     w: 55, h: 46 },
    { key: 'goalMedium', name: 'Portería M',     w: 60, h: 50 },
    { key: 'goalLarge',  name: 'Portería L',     w: 65, h: 55 },
    { key: 'manikin',    name: 'Maniquí',        w: 34, h: 48 }
];

// ---- IMÁGENES DEL CAMPO ----
const EJ_FIELD_IMAGES = {
    full:  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzFhNmIzMCIvPjxjbGlwUGF0aCBpZD0iZmMiPjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjZmMpIj48cmVjdCB4PSIyMCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI4MyIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iMjEwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjI3NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PHJlY3QgeD0iNDAwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPjxyZWN0IHg9IjQ2NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iNTkwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjY1NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PC9nPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+PGxpbmUgeDE9IjQwMCIgeTE9IjE1IiB4Mj0iNDAwIiB5Mj0iNDg1Ii8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjUwIiByPSI2NSIvPjxyZWN0IHg9IjIwIiB5PSIxMzMiIHdpZHRoPSIxMDgiIGhlaWdodD0iMjM0Ii8+PHJlY3QgeD0iNjcyIiB5PSIxMzMiIHdpZHRoPSIxMDgiIGhlaWdodD0iMjM0Ii8+PHJlY3QgeD0iMjAiIHk9IjE5NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjExMCIvPjxyZWN0IHg9Ijc0MCIgeT0iMTk1IiB3aWR0aD0iNDAiIGhlaWdodD0iMTEwIi8+PHJlY3QgeD0iMTAiIHk9IjIyMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjYwIi8+PHJlY3QgeD0iNzgwIiB5PSIyMjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI2MCIvPjxwYXRoIGQ9Ik0xMjggMTk5IEE2NSA2NSAwIDAgMSAxMjggMzAxIi8+PHBhdGggZD0iTTY3MiAxOTkgQTY1IDY1IDAgMCAwIDY3MiAzMDEiLz48cGF0aCBkPSJNMjAgMjIgQTcgNyAwIDAgMSAyNyAxNSIvPjxwYXRoIGQ9Ik03NzMgMTUgQTcgNyAwIDAgMSA3ODAgMjIiLz48cGF0aCBkPSJNNzgwIDQ3OCBBNyA3IDAgMCAxIDc3MyA0ODUiLz48cGF0aCBkPSJNMjcgNDg1IEE3IDcgMCAwIDEgMjAgNDc4Ii8+PC9nPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iMy41IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMjUwIiByPSIzLjUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI3MDAiIGN5PSIyNTAiIHI9IjMuNSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPgo=',
   half:  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMxYTZiMzAiLz4KPGNsaXBQYXRoIGlkPSJmaCI+PHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNzYwIiBoZWlnaHQ9IjQ3MCIgcng9IjEiLz48L2NsaXBQYXRoPgo8ZyBjbGlwLXBhdGg9InVybCgjZmgpIj4KPHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjgzIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjIxMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iMjc0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjxyZWN0IHg9IjQwMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz4KPHJlY3QgeD0iNDY0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjU5MCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iNjU0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjwvZz4KPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjwhLS0gRmllbGQgYm91bmRhcnkgLS0+CjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+CjwhLS0gR29hbCAoNy4zMm0gd2lkZSwgYWJvdmUgZmllbGQgbGluZSkgLS0+CjxyZWN0IHg9IjM1OSIgeT0iMiIgd2lkdGg9IjgyIiBoZWlnaHQ9IjEzIi8+CjwhLS0gUGVuYWx0eSBhcmVhICg0MC4zMm0gd2lkZSB4IDE2LjVtIGRlZXApIC0tPgo8cmVjdCB4PSIxNzUiIHk9IjE1IiB3aWR0aD0iNDUwIiBoZWlnaHQ9IjE0OCIvPgo8IS0tIEdvYWwgYXJlYSAoMTguMzJtIHdpZGUgeCA1LjVtIGRlZXApIC0tPgo8cmVjdCB4PSIyOTgiIHk9IjE1IiB3aWR0aD0iMjA0IiBoZWlnaHQ9IjUwIi8+CjwhLS0gUGVuYWx0eSBhcmMgKG9ubHkgcGFydCBvdXRzaWRlIHBlbmFsdHkgYXJlYSwgZWxsaXB0aWNhbCkgLS0+CjxwYXRoIGQ9Ik0zMTkgMTYzIEExMDIgODIgMCAwIDAgNDgxIDE2MyIvPgo8IS0tIENlbnRlciBzZW1pY2lyY2xlIGF0IGJvdHRvbSBsaW5lIC0tPgo8cGF0aCBkPSJNMjk4IDQ4NSBBMTAyIDgyIDAgMCAxIDUwMiA0ODUiLz4KPCEtLSBDb3JuZXIgYXJjcyB0b3AgLS0+CjxwYXRoIGQ9Ik0yMCAyMiBBNyA3IDAgMCAxIDI3IDE1Ii8+CjxwYXRoIGQ9Ik03NzMgMTUgQTcgNyAwIDAgMSA3ODAgMjIiLz4KPC9nPgo8IS0tIFBlbmFsdHkgc3BvdCAtLT4KPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTEzIiByPSIzLjUiIGZpbGw9IiNmZmYiLz4KPCEtLSBDZW50ZXIgc3BvdCBhdCBib3R0b20gLS0+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjQ4NSIgcj0iMy41IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=',
   halfDown: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMxYTZiMzAiLz4KPGNsaXBQYXRoIGlkPSJmZCI+PHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNzYwIiBoZWlnaHQ9IjQ3MCIgcng9IjEiLz48L2NsaXBQYXRoPgo8ZyBjbGlwLXBhdGg9InVybCgjZmQpIj4KPHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjgzIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjIxMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iMjc0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjxyZWN0IHg9IjQwMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz4KPHJlY3QgeD0iNDY0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjU5MCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iNjU0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjwvZz4KPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjwhLS0gRmllbGQgYm91bmRhcnkgLS0+CjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+CjwhLS0gR29hbCBhdCBib3R0b20gLS0+CjxyZWN0IHg9IjM1OSIgeT0iNDg1IiB3aWR0aD0iODIiIGhlaWdodD0iMTMiLz4KPCEtLSBQZW5hbHR5IGFyZWEgZnJvbSBib3R0b20gLS0+CjxyZWN0IHg9IjE3NSIgeT0iMzM3IiB3aWR0aD0iNDUwIiBoZWlnaHQ9IjE0OCIvPgo8IS0tIEdvYWwgYXJlYSBmcm9tIGJvdHRvbSAtLT4KPHJlY3QgeD0iMjk4IiB5PSI0MzUiIHdpZHRoPSIyMDQiIGhlaWdodD0iNTAiLz4KPCEtLSBQZW5hbHR5IGFyYyAob3V0c2lkZSBwZW5hbHR5IGFyZWEsIGN1cnZpbmcgdXB3YXJkKSAtLT4KPHBhdGggZD0iTTMxOSAzMzcgQTEwMiA4MiAwIDAgMSA0ODEgMzM3Ii8+CjwhLS0gQ2VudGVyIHNlbWljaXJjbGUgYXQgdG9wIGxpbmUgLS0+CjxwYXRoIGQ9Ik0yOTggMTUgQTEwMiA4MiAwIDAgMCA1MDIgMTUiLz4KPCEtLSBDb3JuZXIgYXJjcyBib3R0b20gLS0+CjxwYXRoIGQ9Ik0yNyA0ODUgQTcgNyAwIDAgMSAyMCA0NzgiLz4KPHBhdGggZD0iTTc4MCA0NzggQTcgNyAwIDAgMSA3NzMgNDg1Ii8+CjwvZz4KPCEtLSBQZW5hbHR5IHNwb3QgLS0+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjM4NyIgcj0iMy41IiBmaWxsPSIjZmZmIi8+CjwhLS0gQ2VudGVyIHNwb3QgYXQgdG9wIC0tPgo8Y2lyY2xlIGN4PSI0MDAiIGN5PSIxNSIgcj0iMy41IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=',
    blank: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzFhNmIzMCIvPjxjbGlwUGF0aCBpZD0iZmIiPjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjZmIpIj48cmVjdCB4PSIyMCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI4MyIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iMjEwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjI3NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PHJlY3QgeD0iNDAwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPjxyZWN0IHg9IjQ2NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iNTkwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjY1NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PC9nPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIj48cmVjdCB4PSIyMCIgeT0iMTUiIHdpZHRoPSI3NjAiIGhlaWdodD0iNDcwIiByeD0iMSIvPjwvZz48L3N2Zz4K'
};

// ---- ESTADO DE LA PIZARRA ----
const ejP = {
    fieldType: 'full',
    fieldColor: '#1a6b30',
    svgW: 800, svgH: 500,

    activeTool: 'select',
    myColor: 'blue',
    rivalColor: 'red',
    myGkColor: 'yellow',
    rivalGkColor: 'orange',
    selectedSize: 'small',
    showNumbers: false,
    hasVest: false,
    vestColor: 'yellow',

    lineColor: '#ffffff',
    lineDashed: false,
    lineWidth: 3,

    players: [],
    lines: [],
    shapes: [],
    texts: [],
    equipment: [],
    selectedEquipmentType: 'cone',

    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    isDrawing: false,
    drawStart: null,
    tempShape: null,
    freehandPts: [],

    history: [],
    histIdx: -1,
    isUndoRedo: false,
    playerCounts: {},
    expandedSection: 'players',
nextId: 1,

    // ---- ANIMACIÓN ----
    animMode: false,
    frames: [],
    currentFrame: 0,
    isPlaying: false,
    playSpeed: 800,
    _animId: null, _exportingVideo: false, _lastVideoUrl: null, _videoDesactualizado: false
};

// =============================================
// HISTORIA (UNDO / REDO)
// =============================================
function ejSaveHistory() {
    if (ejP.isUndoRedo) return;
    if (ejP.animMode) ejP._videoDesactualizado = true;
    const snap = {
        players: JSON.stringify(ejP.players),
        lines:   JSON.stringify(ejP.lines),
        shapes:  JSON.stringify(ejP.shapes),
        texts:     JSON.stringify(ejP.texts),
        equipment: JSON.stringify(ejP.equipment)
    };
    ejP.history = ejP.history.slice(0, ejP.histIdx + 1);
    ejP.history.push(snap);
    if (ejP.history.length > 50) ejP.history.shift();
    ejP.histIdx = ejP.history.length - 1;
}

function ejUndo() {
    if (ejP.histIdx <= 0) return;
    ejP.histIdx--;
    const s = ejP.history[ejP.histIdx];
    ejP.isUndoRedo = true;
    ejP.players   = JSON.parse(s.players);
    ejP.lines     = JSON.parse(s.lines);
    ejP.shapes    = JSON.parse(s.shapes);
    ejP.texts     = JSON.parse(s.texts);
    ejP.equipment = s.equipment ? JSON.parse(s.equipment) : [];
    ejP.selectedId = null;
    ejP.isUndoRedo = false;
    ejRenderSVG();
}

function ejRedo() {
    if (ejP.histIdx >= ejP.history.length - 1) return;
    ejP.histIdx++;
    const s = ejP.history[ejP.histIdx];
    ejP.isUndoRedo = true;
    ejP.players   = JSON.parse(s.players);
    ejP.lines     = JSON.parse(s.lines);
    ejP.shapes    = JSON.parse(s.shapes);
    ejP.texts     = JSON.parse(s.texts);
    ejP.equipment = s.equipment ? JSON.parse(s.equipment) : [];
    ejP.selectedId = null;
    ejP.isUndoRedo = false;
    ejRenderSVG();
}

// =============================================
// RENDER SVG
// =============================================
function ejRenderSVG() {
    const svg = document.getElementById('ej-svg');
    if (!svg) return;
    const W = ejP.svgW, H = ejP.svgH;

    let defs = '<defs>';
    // Patrones rayados para jugadores
    for (const p of ejP.players) {
        const tc = EJ_TEAM_COLORS[p.color];
        if (tc && tc.striped) {
            defs += `<pattern id="stp-${p.id}" patternUnits="userSpaceOnUse" width="6" height="10">
                <rect width="3" height="10" fill="${tc.fill}"/>
                <rect x="3" width="3" height="10" fill="${tc.fill2}"/>
            </pattern>`;
        }
    }
    defs += '</defs>';

    // Campo
    let html = defs;
    html += ejGetFieldSVG(ejP.fieldType, ejP.fieldColor);

    // Formas
    for (const s of ejP.shapes) {
        if (ejP.animMode && s.fromFrame !== undefined && (ejP.currentFrame < s.fromFrame || (s.toFrame !== undefined && ejP.currentFrame >= s.toFrame))) continue;
        const sel = s.id === ejP.selectedId;
        const sw = s.strokeWidth || 3;
        const dash = s.dashed ? '10 5' : 'none';
        if (s.type === 'rect') {
            html += `<rect data-id="${s.id}" data-type="shape"
                x="${s.x||0}" y="${s.y||0}" width="${s.w||0}" height="${s.h||0}"
                fill="${s.fill||'none'}" stroke="${s.color}" stroke-width="${sel?sw+1:sw}"
                stroke-dasharray="${dash}" style="cursor:${ejP.activeTool==='select'?'move':'crosshair'};pointer-events:${ejP.activeTool==='select'?'auto':'none'}"/>`;
            if (sel) {
                html += `<rect x="${s.x-3}" y="${s.y-3}" width="${s.w+6}" height="${s.h+6}"
                    fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2" rx="2"/>`;
            }
        } else if (s.type === 'ellipse') {
            html += `<ellipse data-id="${s.id}" data-type="shape"
                cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"
                fill="${s.fill||'none'}" stroke="${s.color}" stroke-width="${sel?sw+1:sw}"
                stroke-dasharray="${dash}" style="cursor:${ejP.activeTool==='select'?'move':'crosshair'};pointer-events:${ejP.activeTool==='select'?'auto':'none'}"/>`;
            if (sel) {
                html += `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx+3}" ry="${s.ry+3}"
                    fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2"/>`;
            }
        }
    }


    // Equipamiento
    for (const eq of ejP.equipment) {
        const eqType = EJ_EQUIPMENT_TYPES.find(t => t.key === eq.eqType);
        const w = (eqType ? eqType.w : 40) * (eq.scale || 1);
        const h = (eqType ? eqType.h : 40) * (eq.scale || 1);
        const sel = eq.id === ejP.selectedId;
        const img = EJ_EQUIPMENT_IMAGES[eq.eqType];
        html += `<g data-id="${eq.id}" data-type="equipment" style="cursor:move" transform="rotate(${eq.rotation||0},${eq.x},${eq.y})">
            <image href="${img}" x="${eq.x - w/2}" y="${eq.y - h/2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>
            ${sel ? `<rect x="${eq.x - w/2 - 3}" y="${eq.y - h/2 - 3}" width="${w+6}" height="${h+6}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2" rx="3"/>` : ''}
        </g>`;
    }

    // Líneas y flechas
    for (const l of ejP.lines) {
        if (ejP.animMode && l.fromFrame !== undefined && (ejP.currentFrame < l.fromFrame || (l.toFrame !== undefined && ejP.currentFrame >= l.toFrame))) continue;
        const sel = l.id === ejP.selectedId;
        const sw = l.strokeWidth || 3;
        const dash = l.dashed ? '10 5' : 'none';
        if (l.type === 'freehand') {
            if (!l.points || l.points.length < 2) continue;
            const d = l.points.map((p,i) => `${i===0?'M':'L'}${p.x} ${p.y}`).join(' ');
            const last = l.points[l.points.length-1];
            const prev = l.points[l.points.length-2];
            const ang = Math.atan2(last.y-prev.y, last.x-prev.x);
            const hl = 8+sw;
            html += `<g data-id="${l.id}" data-type="line" style="cursor:pointer">
                <path d="${d}" stroke="${l.color}" stroke-width="${sel?sw+1:sw}"
                    stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <polygon points="${last.x},${last.y} ${last.x-hl*Math.cos(ang-.4)},${last.y-hl*Math.sin(ang-.4)} ${last.x-hl*Math.cos(ang+.4)},${last.y-hl*Math.sin(ang+.4)}" fill="${l.color}"/>
            </g>`;
        } else if (l.type === 'curved') {
            const cx = l.cx ?? (l.x1+l.x2)/2;
            const cy = l.cy ?? (l.y1+l.y2)/2 - 50;
            const ang = Math.atan2(l.y2-cy, l.x2-cx);
            const hl = 8+sw;
            html += `<g data-id="${l.id}" data-type="line" style="cursor:pointer">
                <path d="M${l.x1} ${l.y1} Q${cx} ${cy} ${l.x2} ${l.y2}"
                    stroke="${l.color}" stroke-width="${sel?sw+1:sw}"
                    stroke-dasharray="${dash}" fill="none" stroke-linecap="round"/>
                <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${l.color}"/>
                ${sel ? `<circle cx="${cx}" cy="${cy}" r="7" fill="#22c55e" stroke="white" stroke-width="2" data-ctrl="${l.id}" style="cursor:grab"/>` : ''}
            </g>`;
        } else {
            // line / arrow
            const dx = l.x2-l.x1, dy = l.y2-l.y1;
            const ang = Math.atan2(dy,dx);
            const hl = 8+sw;
            html += `<g data-id="${l.id}" data-type="line" style="cursor:pointer">
                <line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}"
                    stroke="${l.color}" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}"/>
                ${l.hasArrow ? `<polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${l.color}"/>` : ''}
            </g>`;
        }
        if (sel && l.type !== 'freehand') {
            html += `<circle cx="${l.x1}" cy="${l.y1}" r="5" fill="#22c55e" data-ep="${l.id}-1"/>`;
            html += `<circle cx="${l.x2}" cy="${l.y2}" r="5" fill="#22c55e" data-ep="${l.id}-2"/>`;
        }
    }

    // Línea temporal mientras dibuja
    if (ejP.tempShape) {
        const t = ejP.tempShape;
        const sw = ejP.lineWidth;
        const dash = ejP.lineDashed ? '10 5' : 'none';
        if (t.type === 'line' || t.type === 'arrow') {
            html += `<line x1="${t.x1}" y1="${t.y1}" x2="${t.x2}" y2="${t.y2}" stroke="${ejP.lineColor}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.7"/>`;
        } else if (t.type === 'rect') {
            html += `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="none" stroke="${ejP.lineColor}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.7"/>`;
        } else if (t.type === 'ellipse') {
            html += `<ellipse cx="${t.cx}" cy="${t.cy}" rx="${t.rx}" ry="${t.ry}" fill="none" stroke="${ejP.lineColor}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.7"/>`;
} else if (t.type === 'freehand' && t.points.length > 1) {
            const d = t.points.map((p,i)=>`${i===0?'M':'L'}${p.x} ${p.y}`).join(' ');
            html += `<path d="${d}" stroke="${ejP.lineColor}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.7"/>`;
        } else if (t.type === 'curved') {
            const cx = t.cx ?? (t.x1+t.x2)/2, cy = t.cy ?? (t.y1+t.y2)/2 - 40;
            html += `<path d="M${t.x1} ${t.y1} Q${cx} ${cy} ${t.x2} ${t.y2}" stroke="${ejP.lineColor}" stroke-width="${sw}" fill="none" opacity="0.7"/>`;
            html += `<circle cx="${cx}" cy="${cy}" r="5" fill="#facc15" opacity="0.7"/>`;
        }
    }

    // Textos
    for (const t of ejP.texts) {
        const sel = t.id === ejP.selectedId;
        html += `<g data-id="${t.id}" data-type="text" transform="translate(${t.x},${t.y})" style="cursor:move">
            ${sel ? `<rect x="-55" y="-15" width="110" height="30" fill="none" stroke="#22c55e" stroke-width="1.5" rx="4"/>` : ''}
            <text text-anchor="middle" dominant-baseline="central" fill="${t.color||'#ffffff'}" font-size="${t.size||16}" font-weight="500" font-family="system-ui">${t.text}</text>
        </g>`;
    }

    // Jugadores (encima de todo)
    for (const p of ejP.players) {
        const isGk = p.number == 1;
        const gkColor = p.color === ejP.rivalColor ? ejP.rivalGkColor : ejP.myGkColor;
        const effectiveColor = isGk ? gkColor : p.color;
        const tc = EJ_TEAM_COLORS[effectiveColor] || EJ_TEAM_COLORS.blue;
        const vc = EJ_TEAM_COLORS[p.vestColor] || EJ_TEAM_COLORS.yellow;
        const sel = p.id === ejP.selectedId;
        const scale = p.scale ?? 1.0;
        const r = 14 * scale;
        const fs = 11 * scale;
        const textColor = ['yellow','white','atletico','juventus'].includes(p.color) ? '#1e293b' : '#ffffff';
        const fillAttr = tc.striped ? `url(#stp-${p.id})` : tc.fill;

        html += `<g data-id="${p.id}" data-type="player" transform="translate(${p.x},${p.y})" style="cursor:move">
            ${p.hasVest ? `<circle r="${r+4}" fill="none" stroke="${vc.fill}" stroke-width="4" stroke-dasharray="8 4"/>` : ''}
            <circle r="${r}" fill="${fillAttr}" stroke="${sel?'#22c55e':tc.stroke}" stroke-width="${sel?3:2}"/>
            ${p.showNumber && p.number ? `<text text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-size="${fs}" font-weight="600" font-family="system-ui">${p.number}</text>` : ''}
            ${p.showName && p.name ? `<text text-anchor="middle" y="${r+10}" fill="#ffffff" font-size="9" font-weight="600" font-family="system-ui" style="text-shadow:0 1px 2px rgba(0,0,0,.8)">${p.name.split(' ')[0]}</text>` : ''}
        </g>`;
    }
// Fantasmas del frame anterior - no mostrar durante exportación
if (ejP.animMode && !ejP._exporting && ejP.currentFrame > 0) {
    const prevF = ejP.frames[ejP.currentFrame - 1];
    if (prevF) {
        for (const fp of prevF.players) {
            const cur = ejP.players.find(p => p.id === fp.id);
            if (cur && (Math.abs(cur.x - fp.x) > 3 || Math.abs(cur.y - fp.y) > 3)) {
                html += `<circle cx="${fp.x}" cy="${fp.y}" r="14" fill="none" stroke="#facc15" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.25"/>`;
            }
        }
    }
}

// Trayectorias del frame actual (modo animación) - no mostrar durante exportación
if (ejP.animMode && !ejP._exporting && ejP.frames[ejP.currentFrame]) {
    const trajs = ejP.frames[ejP.currentFrame].trajectories || [];
for (const l of trajs) {
        if (l.isMovement && l.fromX !== undefined) {
            html += `<circle cx="${l.fromX}" cy="${l.fromY}" r="13" fill="none" stroke="#facc15" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.3"/>`;
        }
        const sw = l.strokeWidth || 3;
        const dash = l.dashed ? '10 5' : 'none';
        const col = l.color || '#facc15';
        if (l.type === 'freehand' && l.points && l.points.length > 1) {
            const d = l.points.map((p,i) => `${i===0?'M':'L'}${p.x} ${p.y}`).join(' ');
            html += `<path d="${d}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
        } else if (l.type === 'curved') {
            const cx = l.cx ?? (l.x1+l.x2)/2, cy = l.cy ?? (l.y1+l.y2)/2;
            const ang = Math.atan2(l.y2-cy, l.x2-cx);
            const hl = 8+sw;
            html += `<path d="M${l.x1} ${l.y1} Q${cx} ${cy} ${l.x2} ${l.y2}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" fill="none" opacity="0.85"/>
            <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${col}" opacity="0.85"/>`;
            if (!ejP.isPlaying) {
                html += `<line x1="${(l.x1+l.x2)/2}" y1="${(l.y1+l.y2)/2}" x2="${cx}" y2="${cy}" stroke="#facc15" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="9" fill="#facc15" stroke="white" stroke-width="2" data-traj-ctrl="${l.id}" style="cursor:grab;opacity:0.9"/>`;
            }
        } else if (l.type === 'rect') {
            html += `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.85"/>`;
        } else if (l.type === 'ellipse') {
            html += `<ellipse cx="${l.cx}" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.85"/>`;
        } else if (l.x1 !== undefined) {
            const ang = Math.atan2(l.y2-l.y1, l.x2-l.x1);
            const hl = 8+sw;
            html += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.85"/>`;
            if (l.hasArrow) html += `<polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${col}" opacity="0.85"/>`;
        }
    }
}
    svg.innerHTML = html;
}

// =============================================
// POSICIÓN DEL PUNTERO (mouse + touch)
// =============================================
function ejGetPos(e) {
    const svg = document.getElementById('ej-svg');
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : (e.clientX ?? e.x);
    const clientY = e.touches ? e.touches[0].clientY : (e.clientY ?? e.y);
    // Escalar según tamaño real vs lógico
    const scaleX = ejP.svgW / rect.width;
    const scaleY = ejP.svgH / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top)  * scaleY
    };
}

// =============================================
// EVENT HANDLERS DEL SVG
// =============================================
function ejSvgPointerDown(e) {
    const svg = document.getElementById('ej-svg');
    if (!svg) return;
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);

    const pos = ejGetPos(e);
    const target = e.target;

    // Click en punto de control de flecha curva
    if (target.dataset.ctrl) {
        ejP.isDragging = true;
        ejP._ctrlId = target.dataset.ctrl;
        return;
    }

    // Click en punto de control de trayectoria curva (animación)
    if (target.dataset.trajCtrl) {
        ejP.isDragging = true;
        ejP._trajCtrlId = target.dataset.trajCtrl;
        return;
    }

    // Click en elemento existente
    const el = target.closest ? target.closest('[data-id]') : null;
    const isBackground = !el || target.dataset.bg;

  if (!isBackground && ejP.activeTool === 'select') {
    const id = parseInt(el.dataset.id);
    ejP.selectedId = id;
    ejP.isDragging = true;
    ejP._ctrlId = null;
    const type = el.dataset.type;
    if (type === 'player') ejP.expandedSection = 'players';
    else if (type === 'equipment') ejP.expandedSection = 'material';
    else ejP.expandedSection = 'draw';

    
    if (type === 'player') {
        const p = ejP.players.find(p => p.id === id);
        if (p) {
            ejP.dragOffset = { x: pos.x - p.x, y: pos.y - p.y };
            ejP._dragOriginal = ejP.animMode ? { id, elemType: 'player', x: p.x, y: p.y } : null;
        }
    } else if (type === 'equipment') {
        const eq = ejP.equipment.find(eq => eq.id === id);
        if (eq) {
            ejP.dragOffset = { x: pos.x - eq.x, y: pos.y - eq.y };
            ejP._dragOriginal = ejP.animMode ? { id, elemType: 'equipment', x: eq.x, y: eq.y } : null;
        }
    } else {
        ejP._dragOriginal = null;
        // ... resto del offset para text/shape/line igual que antes
    }
    ejRenderSVG();
    return;
}

    // Herramienta jugador
    if (ejP.activeTool === 'player' && isBackground) {
        ejSaveHistory();
        const scale = ejP.selectedSize === 'small' ? 0.6 : ejP.selectedSize === 'large' ? 1.4 : 1.0;
        const id = ejP.nextId++;

        if (ejP._plantillaMode && ejP._plantilla && ejP._plantillaSelIdx !== undefined) {
            const p = ejP._plantilla[ejP._plantillaSelIdx];
            const isGk = p.position && p.position.toLowerCase().includes('portero');
            const color = isGk ? ejP.myGkColor : ejP.myColor;
            ejP.players.push({
                id, x: pos.x, y: pos.y, color,
                scale, number: p.number, name: p.name,
                showNumber: ejP._plantillaLabel !== 'name',
                showName: ejP._plantillaLabel === 'name' || ejP._plantillaLabel === 'both',
                hasVest: false, vestColor: ejP.vestColor
            });
            ejP._plantillaMode = false;
            ejP._plantillaSelIdx = undefined;
            ejP.activeTool = 'select';
        } else {
            const color = ejP._addingRival ? ejP.rivalColor : ejP.myColor;
            const counts = ejP.playerCounts;
            counts[color] = (counts[color] || 0) + 1;
            ejP.players.push({
                id, x: pos.x, y: pos.y, color,
                scale, number: ejP.showNumbers ? counts[color] : '',
                showNumber: ejP.showNumbers,
                hasVest: ejP.hasVest, vestColor: ejP.vestColor
            });
        }
        ejP.selectedId = id;
        ejRenderSVG();
        ejRenderToolbar();
        return;
    }

    // Herramienta equipamiento
    if (ejP.activeTool === 'equipment' && isBackground) {
        ejSaveHistory();
        const id = ejP.nextId++;
        ejP.equipment.push({ id, x: pos.x, y: pos.y, eqType: ejP.selectedEquipmentType, scale: 0.5, rotation: 0 });
ejP.selectedId = id;
        ejP.activeTool = 'select';
        ejP.expandedSection = 'material';
ejRenderSVG();
ejRenderToolbar();
return;
    }

    // Herramienta texto
    if (ejP.activeTool === 'text' && isBackground) {
        const text = prompt('Introduce el texto:', 'Texto');
        if (text) {
            ejSaveHistory();
            const id = ejP.nextId++;
            ejP.texts.push({ id, x: pos.x, y: pos.y, text, color: '#ffffff', size: 16 });
            ejP.selectedId = id;
            ejRenderSVG();
        }
        return;
    }

 // Herramientas de dibujo
    const drawTools = ['arrow','line','rect','ellipse','curved','pencil'];
    if (drawTools.includes(ejP.activeTool) && ejP.animMode) {
        const SNAP_PLAYER = 30;
        const SNAP_BALL = 22;
        const SNAP_EQUIP = 26;
        let snapElem = null;
        let snapDist = 9999;

        // Primero buscar balón (prioridad máxima, radio pequeño)
        for (const eq of ejP.equipment) {
            if (eq.eqType !== 'ball') continue;
            const dx = pos.x - eq.x, dy = pos.y - eq.y;
            const d = Math.sqrt(dx*dx+dy*dy);
            if (d < SNAP_BALL && d < snapDist) { snapElem = eq; snapDist = d; }
        }
        // Luego otro equipamiento
        if (!snapElem) {
            for (const eq of ejP.equipment) {
                if (eq.eqType === 'ball') continue;
                const dx = pos.x - eq.x, dy = pos.y - eq.y;
                const d = Math.sqrt(dx*dx+dy*dy);
                if (d < SNAP_EQUIP && d < snapDist) { snapElem = eq; snapDist = d; }
            }
        }
        // Finalmente jugadores (solo si no hay balón/equipamiento más cerca)
        for (const p of ejP.players) {
            const dx = pos.x - p.x, dy = pos.y - p.y;
            const d = Math.sqrt(dx*dx+dy*dy);
            if (d < SNAP_PLAYER && d < snapDist) { snapElem = p; snapDist = d; }
        }
if (snapElem) {
            const elemType = ejP.players.find(p => p.id === snapElem.id) ? 'player' : 'equipment';
            ejP._animDrawSnap = { id: snapElem.id, elemType };
            ejP.isDrawing = true;
            ejP.drawStart = { x: snapElem.x, y: snapElem.y };
            if (ejP.activeTool === 'pencil') {
                ejP.tempShape = { type: 'freehand', points: [{ x: snapElem.x, y: snapElem.y }] };
            } else if (ejP.activeTool === 'curved') {
                ejP.tempShape = { type: 'curved', x1: snapElem.x, y1: snapElem.y, x2: snapElem.x, y2: snapElem.y };
            } else {
                ejP.tempShape = { type: 'line', x1: snapElem.x, y1: snapElem.y, x2: snapElem.x, y2: snapElem.y };
            }
            return;
        }
    }
    if (drawTools.includes(ejP.activeTool) && isBackground) {
        ejP.isDrawing = true;
        ejP.drawStart = pos;
        if (ejP.activeTool === 'pencil') {
            ejP.tempShape = { type: 'freehand', points: [pos] };
        } else if (ejP.activeTool === 'rect') {
            ejP.tempShape = { type: 'rect', x: pos.x, y: pos.y, w: 0, h: 0 };
        } else if (ejP.activeTool === 'ellipse') {
            ejP.tempShape = { type: 'ellipse', cx: pos.x, cy: pos.y, rx: 0, ry: 0 };
        } else {
            ejP.tempShape = { type: ejP.activeTool === 'curved' ? 'curved' : 'line',
                x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
        }
        return;
    }

    // Click en fondo con select = deseleccionar
    if (ejP.activeTool === 'select' && isBackground) {
        ejP.selectedId = null;
        ejRenderSVG();
    }
}

function ejSvgPointerMove(e) {
    const pos = ejGetPos(e);

    // Arrastrar punto de control de curva (línea normal)
    if (ejP.isDragging && ejP._ctrlId) {
        const id = parseInt(ejP._ctrlId);
        ejP.lines = ejP.lines.map(l => l.id === id ? { ...l, cx: pos.x, cy: pos.y } : l);
        ejRenderSVG();
        return;
    }

    // Arrastrar punto de control de trayectoria curva (animación)
    if (ejP.isDragging && ejP._trajCtrlId) {
        const id = parseInt(ejP._trajCtrlId);
        const frame = ejP.frames[ejP.currentFrame];
        if (frame && frame.trajectories) {
            const traj = frame.trajectories.find(t => t.id === id);
            if (traj) { traj.cx = pos.x; traj.cy = pos.y; }
        }
        ejRenderSVG();
        return;
    }

    // Arrastrar jugador/equipamiento
    if (ejP.isDragging && ejP.selectedId) {
        const id = ejP.selectedId;
        const p = ejP.players.find(p => p.id === id);
        if (p) {
            p.x = pos.x - ejP.dragOffset.x;
            p.y = pos.y - ejP.dragOffset.y;
        } else {
            const eq = ejP.equipment.find(eq => eq.id === id);
            if (eq) {
                eq.x = pos.x - ejP.dragOffset.x;
                eq.y = pos.y - ejP.dragOffset.y;
            } else {
                const tx = ejP.texts.find(t => t.id === id);
                if (tx) { tx.x = pos.x - ejP.dragOffset.x; tx.y = pos.y - ejP.dragOffset.y; }
                const sh = ejP.shapes.find(s => s.id === id);
                if (sh && sh.x !== undefined) { sh.x = pos.x - ejP.dragOffset.x; sh.y = pos.y - ejP.dragOffset.y; }
            }
        }
        ejRenderSVG();
        return;
    }

    // Actualizar trazo mientras dibuja
    if (ejP.isDrawing && ejP.tempShape) {
        const t = ejP.tempShape;
        if (t.type === 'freehand') {
            t.points.push(pos);
        } else if (t.type === 'rect') {
            t.w = pos.x - t.x; t.h = pos.y - t.y;
        } else if (t.type === 'ellipse') {
            t.rx = Math.abs(pos.x - t.cx); t.ry = Math.abs(pos.y - t.cy);
        } else if (t.type === 'curved') {
            t.x2 = pos.x; t.y2 = pos.y;
            t.cx = (t.x1 + pos.x) / 2; t.cy = (t.y1 + pos.y) / 2 - 40;
        } else {
            t.x2 = pos.x; t.y2 = pos.y;
        }
        ejRenderSVG();
    }
}

function ejSvgPointerUp(e) {
    const pos = ejGetPos(e);

    // Fin de arrastre
    if (ejP.isDragging && ejP.selectedId) {
        ejSaveHistory();
        if (ejP.animMode) ejFrameSaveCurrent();
    }
    ejP.isDragging = false;
    ejP._ctrlId = null;
    ejP._trajCtrlId = null;

    // Fin de dibujo
    if (ejP.isDrawing && ejP.drawStart) {
        const id = ejP.nextId++;
        const color = ejP.lineColor;
        const sw = ejP.lineWidth;
        const dashed = ejP.lineDashed;
        const t = ejP.tempShape;
        let newLine = null;

        if (ejP.activeTool === 'pencil' && t && t.points && t.points.length > 2) {
            newLine = { id, type: 'freehand', points: [...t.points], color, strokeWidth: sw, dashed };
        } else if (ejP.activeTool === 'rect' && t && t.w > 5 && t.h > 5) {
            newLine = { id, type: 'rect', x: t.x, y: t.y, w: t.w, h: t.h, color, fill: 'none', strokeWidth: sw, dashed };
        } else if (ejP.activeTool === 'ellipse' && t && t.rx > 5 && t.ry > 5) {
            newLine = { id, type: 'ellipse', cx: t.cx, cy: t.cy, rx: t.rx, ry: t.ry, color, fill: 'none', strokeWidth: sw, dashed };
        } else if (ejP.activeTool === 'curved' && t) {
            newLine = { id, type: 'curved', x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2,
                cx: t.cx ?? (t.x1+t.x2)/2, cy: t.cy ?? (t.y1+t.y2)/2 - 40,
                color, strokeWidth: sw, dashed, hasArrow: true };
        } else {
            const dx = pos.x - ejP.drawStart.x, dy = pos.y - ejP.drawStart.y;
            if (Math.sqrt(dx*dx+dy*dy) > 5) {
                newLine = { id, type: 'line', x1: ejP.drawStart.x, y1: ejP.drawStart.y,
                    x2: pos.x, y2: pos.y, color, strokeWidth: sw, dashed,
                    hasArrow: ejP.activeTool === 'arrow' };
            }
        }

        if (newLine) {
            if (ejP.animMode && ejP.frames[ejP.currentFrame]) {
                const frame = ejP.frames[ejP.currentFrame];
                if (!frame.trajectories) frame.trajectories = [];
                if (!frame.undoStack) frame.undoStack = [];
                const snap = ejP._animDrawSnap;
                if (snap) {
                    const endX = newLine.x2 ?? newLine.points?.[newLine.points.length-1]?.x ?? pos.x;
                    const endY = newLine.y2 ?? newLine.points?.[newLine.points.length-1]?.y ?? pos.y;
                    const elem = snap.elemType === 'player'
                        ? ejP.players.find(p => p.id === snap.id)
                        : ejP.equipment.find(eq => eq.id === snap.id);
                    if (elem) {
                        newLine.isMovement = true;
                        newLine.fromX = elem.x;
                        newLine.fromY = elem.y;
                        newLine.toX = endX;
                        newLine.toY = endY;
                        newLine.linkedId = snap.id;
                        newLine.color = '#facc15';
                        newLine.strokeWidth = 2;
                        newLine.dashed = true;
                        frame.trajectories.push(newLine);
                        frame.undoStack = frame.undoStack || [];
                        frame.undoStack.push({ type: 'traj', trajId: newLine.id });
                    }
} else {
                    newLine.fromFrame = ejP.currentFrame;
                    if (newLine.type === 'rect' || newLine.type === 'ellipse') ejP.shapes.push(newLine);
                    else ejP.lines.push(newLine);
                    ejSaveHistory();
                }
                ejP._animDrawSnap = null;
            } else {
                if (newLine.type === 'rect' || newLine.type === 'ellipse') ejP.shapes.push(newLine);
                else ejP.lines.push(newLine);
                ejSaveHistory();
            }
        }

        ejP.isDrawing = false;
        ejP.drawStart = null;
        ejP.tempShape = null;
    }
    ejRenderSVG();
}
// =============================================
// ACCIONES
// =============================================
function ejDelete() {
    if (!ejP.selectedId) return;
    ejSaveHistory();
    const id = ejP.selectedId;
    
    // En modo animación, las formas/líneas con fromFrame no se borran, se les pone toFrame
    if (ejP.animMode) {
        var shape = ejP.shapes.find(s => s.id === id && s.fromFrame !== undefined);
        var line = ejP.lines.find(l => l.id === id && l.fromFrame !== undefined);
        if (shape) {
            shape.toFrame = ejP.currentFrame;
            ejP.selectedId = null;
            ejRenderSVG();
            ejRenderToolbar();
            return;
        }
        if (line) {
            line.toFrame = ejP.currentFrame;
            ejP.selectedId = null;
            ejRenderSVG();
            ejRenderToolbar();
            return;
        }
    }
    
    // Borrado normal (sin fromFrame o modo estático)
    ejP.players = ejP.players.filter(p => p.id !== id);
    ejP.lines   = ejP.lines.filter(l => l.id !== id);
    ejP.shapes  = ejP.shapes.filter(s => s.id !== id);
    ejP.texts     = ejP.texts.filter(t => t.id !== id);
    ejP.equipment = ejP.equipment.filter(eq => eq.id !== id);
    ejP.selectedId = null;
    ejRenderSVG();
    ejRenderToolbar();
}
function ejElegirModo(modo) {
    // Ocultar overlay
    var overlay = document.getElementById('ej-modo-overlay');
    if (overlay) overlay.style.display = 'none';
    
    if (modo === 'animado') {
        // Activar modo animación directamente
        if (!ejP.animMode) ejToggleAnimMode();
    } else {
        // Asegurar que animación está desactivada
        if (ejP.animMode) {
            ejP.animMode = false;
            ejP.frames = [];
            ejP.currentFrame = 0;
            var bar = document.getElementById('ej-timeline-bar');
            if (bar) bar.style.display = 'none';
        }
    }
    // Abrir sección jugadores por defecto
    // Mostrar toolbar
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = '';
    ejP.expandedSection = '';
    ejRenderToolbar();
}
function ejNuevaPizarra() {
    if (!confirm('¿Limpiar la pizarra y empezar desde cero?')) return;
    ejSaveHistory();
    ejP.players = []; ejP.lines = []; ejP.shapes = []; ejP.texts = []; ejP.equipment = [];
    ejP.selectedId = null; ejP.playerCounts = {};
    // Resetear animación
    ejFrameStop();
    ejP.animMode = false;
    ejP.frames = [];
    ejP.currentFrame = 0;
    ejP._lastVideoUrl = null;
    ejP._exportingVideo = false;
    ejP._exporting = false;
    window._ejPdfThumbData = null;
    window.ejThumbnailPendiente = null;
    ejEditandoId = null;
    // Limpiar toolbar para que no queden restos
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = 'none';
    const lbl = document.getElementById('ej-pizarra-nombre-label');
    if (lbl) lbl.textContent = 'Pizarra libre';
    ejRenderSVG();
    // Mostrar overlay de selección de modo
    var overlay = document.getElementById('ej-modo-overlay');
    if (overlay) overlay.style.display = 'flex';
    ejRenderToolbar();
}
function ejClearAll() {
    if (!confirm('¿Borrar toda la pizarra?')) return;
    ejSaveHistory();
    ejP.players = []; ejP.lines = []; ejP.shapes = []; ejP.texts = []; ejP.equipment = [];
    ejP.selectedId = null; ejP.playerCounts = {};
    ejRenderSVG();
    ejRenderToolbar();
}

function ejSetTool(tool) {
    ejP.activeTool = tool;
    ejP._addingRival = false;
    ejRenderToolbar();
}
function ejGetFieldSVG(type, color) {
    var c1 = color, c2 = ejLightenColor(color, 12);
    var W = 800, H = 500;
    var s = '';
    // Fondo + franjas
    s += '<rect width="'+W+'" height="'+H+'" fill="'+c1+'"/>';
    for (var i = 0; i < 12; i++) {
        s += '<rect x="'+(20+i*63.3)+'" y="15" width="63" height="470" fill="'+(i%2===0?c2:c1)+'"/>';
    }
    // Líneas blancas según tipo
    var L = 'fill="none" stroke="#fff" stroke-width="2"';
    s += '<g '+L+' stroke-linecap="round" stroke-linejoin="round">';
    s += '<rect x="20" y="15" width="760" height="470" rx="1"/>';
    if (type === 'full') {
        s += '<line x1="400" y1="15" x2="400" y2="485"/>';
        s += '<circle cx="400" cy="250" r="65"/>';
        s += '<rect x="20" y="133" width="108" height="234"/>';
        s += '<rect x="672" y="133" width="108" height="234"/>';
        s += '<rect x="20" y="195" width="40" height="110"/>';
        s += '<rect x="740" y="195" width="40" height="110"/>';
        s += '<rect x="10" y="220" width="10" height="60"/>';
        s += '<rect x="780" y="220" width="10" height="60"/>';
        s += '<path d="M128 199 A65 65 0 0 1 128 301"/>';
        s += '<path d="M672 199 A65 65 0 0 0 672 301"/>';
        s += '<path d="M20 22 A7 7 0 0 1 27 15"/><path d="M773 15 A7 7 0 0 1 780 22"/>';
        s += '<path d="M780 478 A7 7 0 0 1 773 485"/><path d="M27 485 A7 7 0 0 1 20 478"/>';
        s += '</g><circle cx="400" cy="250" r="3.5" fill="#fff"/>';
        s += '<circle cx="100" cy="250" r="3.5" fill="#fff"/><circle cx="700" cy="250" r="3.5" fill="#fff"/>';
    } else if (type === 'half') {
        s += '<rect x="359" y="2" width="82" height="13"/>';
        s += '<rect x="175" y="15" width="450" height="148"/>';
        s += '<rect x="298" y="15" width="204" height="50"/>';
        s += '<path d="M319 163 A102 82 0 0 0 481 163"/>';
        s += '<path d="M298 485 A102 82 0 0 1 502 485"/>';
        s += '<path d="M20 22 A7 7 0 0 1 27 15"/><path d="M773 15 A7 7 0 0 1 780 22"/>';
        s += '</g><circle cx="400" cy="113" r="3.5" fill="#fff"/><circle cx="400" cy="485" r="3.5" fill="#fff"/>';
    } else if (type === 'halfDown') {
        s += '<rect x="359" y="485" width="82" height="13"/>';
        s += '<rect x="175" y="337" width="450" height="148"/>';
        s += '<rect x="298" y="435" width="204" height="50"/>';
        s += '<path d="M319 337 A102 82 0 0 1 481 337"/>';
        s += '<path d="M298 15 A102 82 0 0 0 502 15"/>';
        s += '<path d="M27 485 A7 7 0 0 1 20 478"/><path d="M780 478 A7 7 0 0 1 773 485"/>';
        s += '</g><circle cx="400" cy="387" r="3.5" fill="#fff"/><circle cx="400" cy="15" r="3.5" fill="#fff"/>';
    } else {
        s += '</g>';
    }
    return s;
}

function ejLightenColor(hex, pct) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r + Math.round(r * pct / 100));
    g = Math.min(255, g + Math.round(g * pct / 100));
    b = Math.min(255, b + Math.round(b * pct / 100));
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function ejSetFieldColor(color) {
    ejP.fieldColor = color;
    ejRenderSVG();
    ejRenderToolbar();
}
function ejSetField(type) {
    ejP.fieldType = type;
    ejRenderSVG();
}

function ejApplyFormation(key, isRival) {
    const positions = EJ_FORMATIONS[key];
    if (!positions) return;
    ejSaveHistory();
    const color = isRival ? ejP.rivalColor : ejP.myColor;
    const scale = ejP.selectedSize === 'small' ? 0.6 : ejP.selectedSize === 'large' ? 1.4 : 1.0;
    const ts = Date.now();
    if (!isRival) {
        // Reemplazar mi equipo
        ejP.players = ejP.players.filter(p => {
            const tc = EJ_TEAM_COLORS[p.color];
            return tc && ejP.rivalColor === p.color; // mantener solo rivales
        });
        ejP.playerCounts[color] = 0;
    }
    const offset = ejP.nextId;
    const newPlayers = positions.map((pos, i) => ({
        id: ejP.nextId++,
        x: isRival ? (1 - pos.x) * ejP.svgW : pos.x * ejP.svgW,
        y: pos.y * ejP.svgH,
        color,
        scale,
        number: i + 1,
        showNumber: ejP.showNumbers,
        hasVest: ejP.hasVest,
        vestColor: ejP.vestColor
    }));
    ejP.players = ejP.players.concat(newPlayers);
    ejP.playerCounts[color] = positions.length;
    ejP.selectedId = null;
    ejRenderSVG();
}

function ejChangePlayerSize(dir) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p => {
        if (p.id !== ejP.selectedId) return p;
        const step = 0.1;
        const newScale = dir === 'up'
            ? Math.min((p.scale ?? 1) + step, 2.5)
            : Math.max((p.scale ?? 1) - step, 0.3);
        return { ...p, scale: Math.round(newScale * 100) / 100 };
    });
    ejSaveHistory();
    ejRenderSVG();
}

function ejChangePlayerColor(color) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p =>
        p.id === ejP.selectedId ? { ...p, color } : p
    );
    ejSaveHistory();
    ejRenderSVG();
}
function ejChangePlayerNumber(val) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p =>
        p.id === ejP.selectedId ? { ...p, number: val } : p
    );
    ejSaveHistory();
    ejRenderSVG();
}

function ejTogglePlayerNumber(show) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p =>
        p.id === ejP.selectedId ? { ...p, showNumber: show } : p
    );
    ejSaveHistory();
    ejRenderSVG();
}

function ejChangeEquipmentSize(dir) {
    if (!ejP.selectedId) return;
    ejP.equipment = ejP.equipment.map(eq => {
        if (eq.id !== ejP.selectedId) return eq;
        const step = 0.15;
        const newScale = dir === 'up'
            ? Math.min((eq.scale ?? 1) + step, 3.0)
            : Math.max((eq.scale ?? 1) - step, 0.3);
        return { ...eq, scale: Math.round(newScale * 100) / 100 };
    });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejRotateEquipment(deg) {
    if (!ejP.selectedId) return;
    ejP.equipment = ejP.equipment.map(eq => {
        if (eq.id !== ejP.selectedId) return eq;
        const current = eq.rotation || 0;
        return { ...eq, rotation: (current + deg + 360) % 360 };
    });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}

function ejChangeLineColor(color) {
    if (!ejP.selectedId) return;
    ejP.lines  = ejP.lines.map(l  => l.id === ejP.selectedId  ? {...l, color} : l);
    ejP.shapes = ejP.shapes.map(s => s.id === ejP.selectedId ? {...s, color} : s);
    ejSaveHistory();
    ejRenderSVG();
}
function ejCapturarParaFicha() {
    const svgEl = document.getElementById('ej-svg');
    if (!svgEl) { alert('No hay pizarra para capturar'); return; }
    
    // Limpiar datos del ejercicio anterior si es pizarra libre
    const lbl = document.getElementById('ej-pizarra-nombre-label');
    if (!ejEditandoId || (lbl && lbl.textContent === 'Pizarra libre')) {
        ejEditandoId = null;
        ejP._lastVideoUrl = null;
        window._ejPdfThumbData = null;
        ejLimpiarFicha();
        ejBuildFicha();
    }
    
    // Capturar SVG limpio (sin fantasmas ni trayectorias)
    var prevSelected = ejP.selectedId;
    var prevExporting = ejP._exporting;
    ejP.selectedId = null;
    ejP._exporting = true;
    ejRenderSVG();
    
    window.ejThumbnailPendiente = new XMLSerializer().serializeToString(svgEl);
    
    // Restaurar estado
    ejP.selectedId = prevSelected;
    ejP._exporting = prevExporting || false;
    ejRenderSVG();
    
    ejPrepararThumbParaPDF();
    
    // Cambiar a la pestaña Ficha
    ejShowTab('ficha', document.querySelector('[onclick*="\'ficha\'"]'));
    
    // Actualizar miniatura y vídeo en la ficha
    setTimeout(() => {
        ejActualizarFichaMedia();
        const msg = document.getElementById('ej-ficha-msg');
        if (msg) msg.innerHTML = '<span style="color:#a855f7">📸 Miniatura capturada — rellena los datos y pulsa Guardar</span>';
        setTimeout(() => { if (msg) msg.innerHTML = ''; }, 4000);
    }, 300);
}
function ejExportPNG() {
    ejP.selectedId = null;
    ejRenderSVG();
    setTimeout(() => {
        const svg = document.getElementById('ej-svg');
        // Clonar el SVG y ponerle dimensiones explícitas
        const clone = svg.cloneNode(true);
        clone.setAttribute('width', ejP.svgW);
        clone.setAttribute('height', ejP.svgH);
        const data = new XMLSerializer().serializeToString(clone);
        const canvas = document.createElement('canvas');
        canvas.width = ejP.svgW * 2;
        canvas.height = ejP.svgH * 2;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0, ejP.svgW, ejP.svgH);
            const a = document.createElement('a');
            a.download = 'pizarra_tactica.png';
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
    }, 100);
}

// =============================================
// TOOLBAR HTML
// =============================================
function ejRenderToolbar() {
    const tb = document.getElementById('ej-toolbar');
    if (!tb) return;

    const t = ejP.activeTool;
    const sel = ejP.selectedId;
    const selPlayer    = sel ? ejP.players.find(p => p.id === sel) : null;
    const selLine      = sel ? (ejP.lines.find(l => l.id === sel) || ejP.shapes.find(s => s.id === sel)) : null;
    const selEquipment = sel ? ejP.equipment.find(eq => eq.id === sel) : null;

    // Generar swatches de color
    function colorSwatches(colorKey, solid, striped, onclickFn) {
        let html = '<div class="ej-swatches">';
        for (const [k, v] of Object.entries(EJ_TEAM_COLORS)) {
            if (v.striped && !striped) continue;
            if (!v.striped && !solid) continue;
            const active = colorKey === k;
            if (v.striped) {
                html += `<div class="ej-swatch${active?' active':''}" title="${v.name}"
                    style="background:repeating-linear-gradient(90deg,${v.fill} 0px,${v.fill} 4px,${v.fill2} 4px,${v.fill2} 8px)"
                    onclick="${onclickFn}('${k}')"></div>`;
            } else {
                html += `<div class="ej-swatch${active?' active':''}" title="${v.name}"
                    style="background:${v.fill}" onclick="${onclickFn}('${k}')"></div>`;
            }
        }
        return html + '</div>';
    }

    function formationBtns(fn) {
        return Object.keys(EJ_FORMATIONS).map(k =>
            `<button class="ej-btn-formation" onclick="${fn}('${k}')">${k}</button>`
        ).join('');
    }

    function sectionHeader(id, icon, label) {
        const open = ejP.expandedSection === id;
        return `<div class="ej-section-header${open?' open':''}" onclick="ejToggleSection('${id}')">${icon} ${label}</div>`;
    }

    const playersOpen = ejP.expandedSection === 'players';
    const drawOpen    = ejP.expandedSection === 'draw';
    const actionsOpen = ejP.expandedSection === 'actions';

    tb.innerHTML = `
  <!-- BOTÓN MODO ANIMACIÓN (solo visible en modo animado) -->
${ejP.animMode ? `<div style="background:#7c3aed;border:1px solid #a855f7;margin-bottom:6px;width:100%;padding:8px;border-radius:6px;text-align:center;color:#fff;font-size:12px;font-weight:600">
        🎬 Modo Animación ON
    </div>` : ''}

    <!-- SECCIÓN JUGADORES -->
    ${sectionHeader('players','⚽','Jugadores')}
    ${playersOpen ? `
    <div class="ej-section-body">
        <div class="ej-team-block">
            <label class="ej-team-label blue">🔵 Mi equipo</label>
            ${colorSwatches(ejP.myColor, true, true, 'ejSetMyColor')}
            <label style="font-size:10px;color:#9ca3af;margin-top:4px;display:block">🧤 Portero (nº1):</label>
            ${colorSwatches(ejP.myGkColor, true, false, 'ejSetMyGkColor')}
            <div class="ej-formations">${formationBtns('ejApplyFormation_my')}</div>
        </div>
        <div class="ej-team-block rival">
            <label class="ej-team-label red">🔴 Equipo rival</label>
            ${colorSwatches(ejP.rivalColor, true, true, 'ejSetRivalColor')}
            <label style="font-size:10px;color:#9ca3af;margin-top:4px;display:block">🧤 Portero (nº1):</label>
            ${colorSwatches(ejP.rivalGkColor, true, false, 'ejSetRivalGkColor')}
            <div class="ej-formations rival">${formationBtns('ejApplyFormation_rival')}</div>
        </div>
        <div class="ej-opts-block">
            <label class="ej-opts-label">Opciones</label>
            <button onclick="ejCargarPlantilla()" style="width:100%;padding:7px;background:#1e3a5f;border:1px solid #2563eb;color:#93c5fd;border-radius:6px;cursor:pointer;font-size:12px;margin-bottom:6px">
                👥 Cargar mi plantilla
            </button>
            ${ejP._plantilla && ejP._plantilla.length ? `
            <div style="margin-bottom:8px">
                <div style="font-size:10px;color:#64748b;margin-bottom:4px;text-transform:uppercase">Mi plantilla — clic para colocar</div>
            <div style="display:flex;gap:4px;margin-bottom:6px">
                ${['num','name','both'].map(opt => {
                    const lbl = opt==='num'?'Nº':opt==='name'?'Nombre':'Nº+Nombre';
                    const active = (ejP._plantillaLabel||'num') === opt;
                    return `<button onclick="ejP._plantillaLabel='${opt}';ejRenderToolbar()" style="flex:1;padding:3px;font-size:9px;border-radius:4px;border:1px solid ${active?'#3b82f6':'#334155'};background:${active?'#1e3a5f':'transparent'};color:${active?'#93c5fd':'#64748b'};cursor:pointer">${lbl}</button>`;
                }).join('')}
            </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-height:200px;overflow-y:auto">
                    ${ejP._plantilla.map((p, i) => {
                        const isGk = p.position && p.position.toLowerCase().includes('portero');
                        const col = isGk ? EJ_TEAM_COLORS[ejP.myGkColor] : EJ_TEAM_COLORS[ejP.myColor];
                        const active = ejP._plantillaSelIdx === i;
                        return `<div onclick="ejColocarJugadorPlantilla(${i})" title="${p.name}" style="
                            display:flex;flex-direction:column;align-items:center;gap:2px;
                            padding:4px 2px;border-radius:6px;cursor:pointer;
                            background:${active?'#1e3a5f':'transparent'};
                            border:1px solid ${active?'#3b82f6':'transparent'}">
                            <div style="width:28px;height:28px;border-radius:50%;background:${col?.fill||'#3b82f6'};border:2px solid ${col?.stroke||'#2563eb'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">
                                ${p.number}
                            </div>
                            <span style="font-size:8px;color:#9ca3af;text-align:center;line-height:1.1;max-width:36px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split(' ')[0]}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}
            <button class="ej-btn-tool${t==='player'&&!ejP._addingRival&&!ejP._plantillaMode?' active':''}" onclick="ejSetTool('player');ejP._addingRival=false;ejP._plantillaMode=false;ejRenderToolbar()">
                + Jugador (mi equipo)
            </button>
            <button class="ej-btn-tool${t==='player'&&ejP._addingRival?' active':''}" onclick="ejSetTool('player');ejP._addingRival=true;ejRenderToolbar()" style="border-color:#ef4444">
                + Jugador (rival)
            </button>
            <div class="ej-size-row">
                <span>Tamaño nuevo:</span>
                ${['small','medium','large'].map(s=>
                    `<button class="ej-sz${ejP.selectedSize===s?' active':''}" onclick="ejP.selectedSize='${s}';ejRenderToolbar()">${s==='small'?'S':s==='medium'?'M':'L'}</button>`
                ).join('')}
            </div>
            <label class="ej-check"><input type="checkbox" ${ejP.showNumbers?'checked':''} onchange="ejP.showNumbers=this.checked"> Mostrar números</label>
            <label class="ej-check"><input type="checkbox" ${ejP.hasVest?'checked':''} onchange="ejP.hasVest=this.checked"> Con peto</label>
            ${ejP.hasVest ? `<div class="ej-swatches">${
                Object.entries(EJ_TEAM_COLORS).filter(([,v])=>!v.striped).map(([k,v])=>
                    `<div class="ej-swatch${ejP.vestColor===k?' active':''}" style="background:${v.fill}" onclick="ejP.vestColor='${k}';ejRenderToolbar()"></div>`
                ).join('')
            }</div>` : ''}
        </div>
        ${selPlayer ? `
        <div class="ej-selected-block">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Jugador seleccionado</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <label style="font-size:11px;color:#9ca3af">Nº camiseta:</label>
                <input type="text" value="${selPlayer.number||''}" maxlength="3"
                    onchange="ejChangePlayerNumber(this.value)"
                    style="width:50px;padding:4px 6px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:6px;font-size:14px;font-weight:700;text-align:center"/>
                <label style="font-size:11px;color:#9ca3af;margin-left:4px">
                    <input type="checkbox" ${selPlayer.showNumber?'checked':''} onchange="ejTogglePlayerNumber(this.checked)"> Ver nº
                </label>
            </div>
            <label style="font-size:11px;color:#9ca3af">Cambiar color:</label>
            ${colorSwatches(selPlayer.color, true, true, 'ejChangePlayerColor')}
        </div>` : ''}
    </div>` : ''}

    <!-- SECCIÓN DIBUJO -->
    ${sectionHeader('draw','✏️','Dibujo y Campos')}
   
         ${drawOpen ? `
    <div class="ej-section-body">
        <div class="ej-field-btns">
            ${['full','half','halfDown','blank'].map(f=>`<button class="ej-btn-sm${ejP.fieldType===f?' active':''}" onclick="ejSetField('${f}')">${f==='full'?'Completo':f==='half'?'Medio ↑':f==='halfDown'?'Medio ↓':'Libre'}</button>`).join('')}
        </div>
        <div style="display:flex;gap:4px;margin-top:6px">
            ${['#1a6b30','#1a8540','#2d8a4e','#0f4c2a','#1e3a5f','#0a1628','#2c2c2c'].map(c =>
                '<div onclick="ejSetFieldColor(\''+c+'\')" style="width:22px;height:22px;border-radius:50%;background:'+c+';cursor:pointer;border:2px solid '+(ejP.fieldColor===c?'#fff':'transparent')+'"></div>'
            ).join('')}
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <button class="ej-btn-tool${t==='select'?' active':''}" onclick="ejSetTool('select')" title="Seleccionar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 0L4 20L9 15H16L4 0Z"/></svg>
                Seleccionar
            </button>
        </div>
        <div class="ej-draw-tools">
            ${[
                {k:'pencil',  ico:'✏️', lbl:'Lápiz'},
                {k:'arrow',   ico:'➡️', lbl:'Flecha'},
                {k:'curved',  ico:'↗️', lbl:'Curva'},
                {k:'line',    ico:'➖', lbl:'Línea'},
                {k:'rect',    ico:'⬜', lbl:'Rect.'},
                {k:'ellipse', ico:'⭕', lbl:'Círculo'},
                {k:'text',    ico:'T',  lbl:'Texto'}
            ].map(item=>`<button class="ej-btn-tool${t===item.k?' active':''}" onclick="ejSetTool('${item.k}')">${item.ico} ${item.lbl}</button>`).join('')}
        </div>
        <div class="ej-draw-opts">
            <span>Grosor: <input type="range" min="1" max="10" value="${ejP.lineWidth}" oninput="ejP.lineWidth=+this.value" style="width:80px;vertical-align:middle;accent-color:#22c55e"></span>
            <label><input type="checkbox" ${ejP.lineDashed?'checked':''} onchange="ejP.lineDashed=this.checked;ejRenderToolbar()"> Discontinua</label>
        </div>
        <label style="font-size:11px;color:#9ca3af">Color de línea:</label>
        <div class="ej-line-colors">
            ${EJ_LINE_COLORS.map(c=>`<div class="ej-lcolor${ejP.lineColor===c.c?' active':''}" style="background:${c.c}" title="${c.n}" onclick="ejP.lineColor='${c.c}';ejRenderToolbar()"></div>`).join('')}
        </div>
        <div class="ej-actions-row" style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <button class="ej-act-btn undo" onclick="ejUndo()" title="Deshacer (Ctrl+Z)">↩ Deshacer</button>
            <button class="ej-act-btn redo" onclick="ejRedo()" title="Rehacer (Ctrl+Y)">↪ Rehacer</button>
        </div>
    </div>` : ''}
    <!-- SECCIÓN MATERIAL -->
    ${sectionHeader('material','🏅','Material')}
    ${ejP.expandedSection === 'material' ? `
    <div class="ej-section-body">
        <div class="ej-equipment-grid">
            ${EJ_EQUIPMENT_TYPES.map(eq => `
            <button class="ej-btn-equipment${ejP.selectedEquipmentType===eq.key&&t==='equipment'?' active':''}"
                onclick="ejP.selectedEquipmentType='${eq.key}';ejSetTool('equipment')"
                title="${eq.name}">
                <img src="${EJ_EQUIPMENT_IMAGES[eq.key]}" alt="${eq.name}" class="ej-eq-thumb"/>
                <span>${eq.name}</span>
            </button>`).join('')}
        </div>
        ${selEquipment ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">Material seleccionado: <strong style="color:#fff">${EJ_EQUIPMENT_TYPES.find(e=>e.key===selEquipment.eqType)?.name||''}</strong></div>
            <div style="display:flex;gap:4px;margin-bottom:6px">
                <button onclick="ejChangeEquipmentSize('down')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#f97316;border-radius:6px;cursor:pointer">− Menor</button>
                <button onclick="ejChangeEquipmentSize('up')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#22c55e;border-radius:6px;cursor:pointer">+ Mayor</button>
            </div>
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Rotación: ${selEquipment.rotation||0}°</div>
            <div style="display:flex;gap:3px;margin-bottom:4px">
                <button onclick="ejRotateEquipment(-45)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">−45°</button>
                <button onclick="ejRotateEquipment(-10)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">−10°</button>
                <button onclick="ejRotateEquipment(10)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">+10°</button>
                <button onclick="ejRotateEquipment(45)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">+45°</button>
            </div>
            <input type="range" min="0" max="359" value="${selEquipment.rotation||0}" oninput="ejRotateEquipment(parseInt(this.value)-(${selEquipment.rotation||0}))" style="width:100%;accent-color:#a855f7"/>
        </div>` : ''}
    </div>` : ''}


    <!-- BOTONES PRINCIPALES -->
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${ejP.animMode && ejEditandoId ? '' : '<button class="ej-act-btn purple full" onclick="ejCapturarParaFicha()" style="width:100%;padding:10px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">📋 Guardar ejercicio</button>'}
        <button class="ej-act-btn green full" onclick="ejExportPNG()" style="width:100%;padding:8px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:8px;cursor:pointer;font-size:12px">📥 Exportar PNG</button>
        <button class="ej-act-btn red full" onclick="ejDelete()" ${!sel?'disabled':''} style="width:100%;padding:8px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:8px;cursor:pointer;font-size:12px">🗑 Eliminar seleccionado</button>
    </div>
    `;
}

function ejToggleSection(id) {
    ejP.expandedSection = ejP.expandedSection === id ? '' : id;
    ejRenderToolbar();
}

// Wrappers para onclick (no se puede pasar booleano directamente)
function ejApplyFormation_my(key)    { ejApplyFormation(key, false); }
function ejApplyFormation_rival(key) { ejApplyFormation(key, true);  }
function ejSetMyColor(c)      { ejP.myColor     = c; ejRenderToolbar(); ejRenderSVG(); }
function ejSetRivalColor(c)   { ejP.rivalColor  = c; ejRenderToolbar(); ejRenderSVG(); }
function ejSetMyGkColor(c)    { ejP.myGkColor   = c; ejRenderToolbar(); ejRenderSVG(); }
function ejSetRivalGkColor(c) { ejP.rivalGkColor = c; ejRenderToolbar(); ejRenderSVG(); }

// =============================================
// LAYOUT PRINCIPAL DE LA PIZARRA
// =============================================
function ejBuildPizarraLayout() {
    const root = document.getElementById('ej-pizarra-container');
    if (!root) return;
root.innerHTML = `
<div id="ej-pizarra-wrap">
        <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <div id="ej-pizarra-topbar" style="display:flex;align-items:center;justify-content:space-between;background:#1e3a5f;border:1px solid #2563eb;border-radius:8px;padding:8px 14px;margin-bottom:8px;gap:10px">
            <div style="display:flex;align-items:center;gap:8px;min-width:0">
                <span style="font-size:14px">📋</span>
                <span id="ej-pizarra-nombre-label" style="color:#93c5fd;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Pizarra libre</span>
            </div>
            <button onclick="ejNuevaPizarra()" style="background:#0f172a;border:1px solid #475569;color:#94a3b8;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap;flex-shrink:0">✕ Nueva pizarra</button>
</div>
        <div id="ej-toolbar"></div>
        </div>
        <div id="ej-canvas-area" style="position:relative">
        <div id="ej-modo-overlay" style="position:absolute;inset:0;background:rgba(15,23,42,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;border-radius:8px;gap:20px">
                <div style="color:#e2e8f0;font-size:18px;font-weight:700;text-align:center">¿Qué tipo de ejercicio quieres crear?</div>
                <div style="display:flex;gap:16px">
                    <button onclick="ejElegirModo('estatico')" style="padding:16px 32px;background:#3b82f6;border:none;color:white;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:6px">
                        <span style="font-size:28px">🖼️</span>
                        Ejercicio estático
                    </button>
                    <button onclick="ejElegirModo('animado')" style="padding:16px 32px;background:#7c3aed;border:none;color:white;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:6px">
                        <span style="font-size:28px">🎬</span>
                        Ejercicio animado
                    </button>
                </div>
                <p style="color:#64748b;font-size:12px;margin:0">Puedes cambiar de modo en cualquier momento</p>
            </div>
            <svg id="ej-svg"
                width="100%"
                viewBox="0 0 ${ejP.svgW} ${ejP.svgH}"
                style="width:100%;height:auto;display:block;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.5);touch-action:none;cursor:crosshair">
          </svg>
        </div>
        <div id="ej-timeline-bar" style="display:none;background:#0f172a;border:1px solid #1e3a5f;border-radius:8px;padding:8px 12px;margin-top:8px"></div>
    </div>`;

    const svg = document.getElementById('ej-svg');
    svg.addEventListener('pointerdown', ejSvgPointerDown);
    svg.addEventListener('pointermove', ejSvgPointerMove);
    svg.addEventListener('pointerup',   ejSvgPointerUp);
    svg.addEventListener('pointerleave', ejSvgPointerUp);

    // Teclas
// Empezar con todo colapsado
    ejP.expandedSection = '';
    // Ocultar toolbar hasta que elija modo
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = 'none';
    ejSaveHistory();
    ejRenderToolbar();
    ejRenderSVG();
    // Tecla Supr para eliminar seleccionado
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && ejP.selectedId) {
            const focused = document.activeElement;
            const isInput = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
            if (!isInput) {
                e.preventDefault();
                ejDelete();
            }
        }
    });
}

// =============================================
// SECCIÓN FICHA DEL EJERCICIO
// =============================================
function ejBuildFicha() {
    const root = document.getElementById('ej-ficha-container');
    if (!root) return;
    root.innerHTML = `
    <div class="ej-ficha-form" style="max-width:960px;margin:0 auto">

        <!-- MEDIA: MINIATURA + VÍDEO -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;overflow:hidden;margin-bottom:16px">
            <div style="padding:14px 16px;border-right:1px solid #1e3a5f">
                <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎨 Miniatura</div>
                <div id="ej-ficha-thumb" style="width:100%;aspect-ratio:8/5;border-radius:8px;background:#1e3a5f;display:flex;align-items:center;justify-content:center;overflow:hidden">
                    <span style="color:#475569;font-size:11px">Dibuja en la pizarra y pulsa "Usar en ficha"</span>
                </div>
                
            </div>
            <div style="padding:14px 16px">
                <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎬 Vídeo animación</div>
                <div id="ej-ficha-video" style="width:100%;aspect-ratio:8/5;border-radius:8px;background:#1e3a5f;display:flex;align-items:center;justify-content:center;overflow:hidden">
                    <span style="color:#475569;font-size:11px">Exporta MP4 desde la pizarra</span>
                </div>
                <div id="ej-ficha-video-btns" style="margin-top:6px;display:flex;gap:6px"></div>
            </div>
        </div>

        <!-- DATOS PRINCIPALES -->
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:16px;margin-bottom:16px">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">
                <div class="ej-field">
                    <label>Nombre del ejercicio *</label>
                    <input type="text" id="ej-nombre" placeholder="Ej: Rondo 4x1">
                    <div id="ej-nombre-lock-msg" style="display:none;font-size:10px;color:#64748b;margin-top:2px">🔒 El nombre no se puede cambiar</div>
                </div>
                <div class="ej-field">
                    <label>Duración (min)</label>
                    <input type="number" id="ej-duracion" min="1" max="90" placeholder="15">
                </div>
                <div class="ej-field">
                    <label>Nº jugadores</label>
                    <input type="number" id="ej-jugadores" min="1" max="30" placeholder="14" oninput="ejCalcEII()">
                </div>
                <div class="ej-field">
                    <label>Dificultad</label>
                    <select id="ej-dificultad">
                        <option value="">--</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">
                <div class="ej-field">
                    <label>Categoría</label>
                    <select id="ej-categoria">
                        <option value="">-- Seleccionar --</option>
                        <option>Técnica individual</option>
                        <option>Posesión</option>
                        <option>Pressing</option>
                        <option>Ataque posicional</option>
                        <option>Defensa</option>
                        <option>Transiciones</option>
                        <option>Portería</option>
                        <option>Físico</option>
                        <option>Táctica</option>
                    </select>
                </div>
                <div class="ej-field">
                    <label>Categoría de edad</label>
                    <select id="ej-edad">
                        <option value="">-- Todas --</option>
                        <option>Prebenjamín</option><option>Benjamín</option><option>Alevín</option>
                        <option>Infantil</option><option>Cadete</option><option>Juvenil</option>
                        <option>Senior</option>
                    </select>
                </div>
                <div class="ej-field">
                    <label>Tema</label>
                    <select id="ej-tema">
                        <option value="">-- Seleccionar --</option>
                        <option>Calentamiento</option>
                        <option>Cambios de orientación</option>
                        <option>Centros laterales</option>
                        <option>Contraataque</option>
                        <option>Defensa en bloque bajo</option>
                        <option>Defensa en inferioridad</option>
                        <option>Duelos</option>
                        <option>Finalización</option>
                        <option>Físico-Técnico</option>
                        <option>Juego de posición</option>
                        <option>Juego interior</option>
                        <option>Juegos Lúdicos</option>
                        <option>Partidos</option>
                        <option>Porteros</option>
                        <option>Posesiones</option>
                        <option>Presión</option>
                        <option>Press perdida</option>
                        <option>Progresión en el juego</option>
                        <option>Rondos</option>
                        <option>Ruedas de pases</option>
                        <option>Salida de balón</option>
                        <option>Tercer hombre</option>
                        <option>Trabajo táctico</option>
                        <option>Transiciones</option>
                        <option>Técnica individual</option>
                    </select>
                </div>
                <div class="ej-field">
                    <label>Fase de juego</label>
                    <select id="ej-fase">
                        <option value="">-- Todas --</option>
                        <option>Organización ofensiva</option>
                        <option>Organización defensiva</option>
                        <option>Transición ataque</option>
                        <option>Transición defensa</option>
                        <option>Balón parado</option>
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px">
                <div class="ej-field">
                    <label>Nº porteros</label>
                    <input type="number" id="ej-porteros" min="0" max="4" placeholder="0">
                </div>
                <div class="ej-field">
                    <label>Espacio (ancho × largo)</label>
                    <div style="display:flex;gap:4px;align-items:center">
                        <input type="number" id="ej-ancho" placeholder="20" min="1" oninput="ejCalcEII()" style="width:60px">
                        <span style="color:#64748b;font-size:12px">×</span>
                        <input type="number" id="ej-largo" placeholder="25" min="1" oninput="ejCalcEII()" style="width:60px">
                        <span style="color:#64748b;font-size:11px">m</span>
                    </div>
                </div>
                <div class="ej-field">
                    <label>EII</label>
                    <span id="ej-eii-display" style="color:#9ca3af;font-size:13px;padding-top:6px;display:block"></span>
                </div>
                <div class="ej-field">
                    <label>Material</label>
                    <input type="text" id="ej-material" placeholder="Conos, picas, petos...">
                </div>
            </div>
        </div>

        <!-- TEXTOS -->
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:16px;margin-bottom:16px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                <div class="ej-field">
                    <label>Objetivos</label>
                    <textarea id="ej-objetivos" rows="2" placeholder="¿Qué trabaja este ejercicio?"></textarea>
                </div>
                <div class="ej-field">
                    <label>Descripción / Desarrollo</label>
                    <textarea id="ej-descripcion" rows="2" placeholder="Describe cómo se ejecuta..."></textarea>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="ej-field">
                    <label>Variantes</label>
                    <textarea id="ej-variantes" rows="2" placeholder="Versiones más fáciles o difíciles..."></textarea>
                </div>
                <div class="ej-field">
                    <label>Notas del entrenador</label>
                    <textarea id="ej-notas" rows="2" placeholder="Observaciones, puntos clave..."></textarea>
                </div>
            </div>
        </div>

        <!-- BOTONES -->
        <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;flex-wrap:wrap">
        <button onclick="ejEditarDibujo()" style="padding:9px 16px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600" id="ej-btn-editar-dibujo">✏️ Editar dibujo</button>
            <button class="ej-btn-save" onclick="ejGuardarEjercicio()" style="padding:9px 22px">💾 Guardar ejercicio</button>
            <button class="ej-btn-cancel" onclick="ejLimpiarFicha()" style="padding:9px 16px">✕ Limpiar</button>
            <button onclick="ejExportarPDF()" style="padding:9px 16px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">📄 Exportar PDF</button>
            <button onclick="ejEliminarEjercicio()" style="padding:9px 16px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:8px;cursor:pointer;font-size:12px" id="ej-btn-eliminar">🗑 Eliminar</button>
        </div>
        <div id="ej-ficha-msg" style="margin-top:8px"></div>
    </div>`;
}
function ejCapturarMiniatura() {
    const svgEl = document.getElementById('ej-svg');
    if (!svgEl) { alert('Ve a la Pizarra y dibuja primero'); return; }
    const thumbContainer = document.getElementById('ej-ficha-thumb');
    if (!thumbContainer) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width', '100%');
    clone.setAttribute('height', '100%');
    clone.removeAttribute('style');
    clone.style.borderRadius = '8px';
    thumbContainer.innerHTML = '';
    thumbContainer.appendChild(clone);
    window.ejThumbnailPendiente = new XMLSerializer().serializeToString(svgEl);
    ejPrepararThumbParaPDF();
    const msg = document.getElementById('ej-ficha-msg');
    if (msg) msg.innerHTML = '<span style="color:#a855f7">📸 Miniatura capturada — se guardará con el ejercicio</span>';
    setTimeout(() => { if (msg) msg.innerHTML = ''; }, 3000);
}

function ejActualizarFichaMedia() {
    // Miniatura
    const thumbContainer = document.getElementById('ej-ficha-thumb');
    if (thumbContainer) {
        const svgSource = window.ejThumbnailPendiente;
        if (svgSource) {
            thumbContainer.innerHTML = svgSource;
            const svg = thumbContainer.querySelector('svg');
            if (svg) { svg.setAttribute('width','100%'); svg.setAttribute('height','100%'); svg.style.borderRadius='8px'; svg.style.display='block'; }
        }
    }
    // Vídeo
    const videoContainer = document.getElementById('ej-ficha-video');
    const videoBtns = document.getElementById('ej-ficha-video-btns');
    const url = ejP._lastVideoUrl;
    if (videoContainer && url) {
        videoContainer.innerHTML = '<video src="'+url+'" controls playsinline loop style="width:100%;height:100%;border-radius:8px;background:#000"></video>';
        if (videoBtns) videoBtns.innerHTML = '<a href="https://toplidercoach.com/wp-content/uploads/ejercicios/download-video.php?url='+encodeURIComponent(url)+'" target="_blank" style="flex:1;padding:8px;background:#f97316;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;text-align:center;text-decoration:none">📥 Descargar MP4</a>';
    }
}

function ejExportarPDF() {
    const nombre = document.getElementById('ej-nombre')?.value?.trim();
    if (!nombre) { alert('Pon un nombre al ejercicio primero'); return; }

    const svgSource = window.ejThumbnailPendiente;
    if (svgSource && !window._ejPdfThumbData) {
        ejPrepararThumbParaPDF();
        setTimeout(() => ejGenerarPDF(nombre), 600);
    } else {
        ejGenerarPDF(nombre);
    }
}

function ejGenerarPDF(nombre) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, H = 297;
    const mL = 15, mR = 15;
    const contentW = W - mL - mR;
    let y = 0;

    // === PALETA ===
    const brand    = [37, 99, 235];
    const brandDk  = [25, 70, 176];
    const black    = [33, 37, 41];
    const dark     = [55, 65, 81];
    const gray     = [107, 114, 128];
    const lightBg  = [248, 250, 252];
    const tableBg  = [241, 245, 249];
    const borderC  = [226, 232, 240];
    const accentGreen = [22, 163, 74];
    const accentAmber = [217, 119, 6];

    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? (el.value || '').trim() : '';
    };

    // ======================================================
    // HEADER — banda de color con marca
    // ======================================================
    doc.setFillColor(...brand);
    doc.rect(0, 0, W, 28, 'F');

    // Acento diagonal decorativo
    doc.setFillColor(...brandDk);
    doc.triangle(0, 28, 60, 28, 0, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('TopLiderCoach', mL, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 220, 255);
    doc.text('FICHA DE EJERCICIO', mL, 18);

    // Fecha a la derecha
    const hoy = new Date();
    const fecha = hoy.getDate() + '/' + (hoy.getMonth() + 1) + '/' + hoy.getFullYear();
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 255);
    doc.text(fecha, W - mR, 12, { align: 'right' });

    y = 34;

    // ======================================================
    // NOMBRE DEL EJERCICIO
    // ======================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text(nombre, mL, y);

    // Badges inline
    const dif = getValue('ej-dificultad');
    const edad = getValue('ej-edad');
    let badgeX = mL + doc.getTextWidth(nombre) + 4;

    if (dif) {
        const difColors = {'1':[22,163,74],'2':[22,163,74],'3':[217,119,6],'4':[234,88,12],'5':[220,38,38]};
        const dc = difColors[dif] || gray;
        doc.setFillColor(...dc);
        doc.roundedRect(badgeX, y - 4.5, 18, 6, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Dif: ' + dif, badgeX + 9, y - 0.8, { align: 'center' });
        badgeX += 21;
    }
    if (edad) {
        doc.setFillColor(...tableBg);
        doc.setDrawColor(...borderC);
        doc.roundedRect(badgeX, y - 4.5, doc.getTextWidth(edad) * 0.55 + 8, 6, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...dark);
        doc.text(edad, badgeX + 4, y - 0.8);
    }

    y += 4;
    doc.setDrawColor(...brand);
    doc.setLineWidth(0.6);
    doc.line(mL, y, mL + 40, y);
    y += 6;

    // ======================================================
    // MINIATURA
    // ======================================================
    if (window._ejPdfThumbData) {
        const thumbW = contentW;
        const thumbH = thumbW * (500 / 800);
        doc.setDrawColor(...borderC);
        doc.setLineWidth(0.3);
        doc.roundedRect(mL - 0.5, y - 0.5, thumbW + 1, thumbH + 1, 2, 2, 'S');
        doc.addImage(window._ejPdfThumbData, 'PNG', mL, y, thumbW, thumbH);
        y += thumbH + 3;
    }

    // ======================================================
    // DATOS EN DOS COLUMNAS (key-value cards)
    // ======================================================
    const a = parseFloat(getValue('ej-ancho'));
    const l = parseFloat(getValue('ej-largo'));
    const j = parseFloat(getValue('ej-jugadores'));
    const eii = (a && l && j) ? ((a * l) / j).toFixed(1) + ' m2/jug' : '';
    const espacio = (a && l) ? a + ' x ' + l + ' m' : '';

    const campos = [
        { label: 'Categoria',    value: getValue('ej-categoria') },
        { label: 'Edad',         value: getValue('ej-edad') },
        { label: 'Tema',         value: getValue('ej-tema') },
        { label: 'Fase de juego',value: getValue('ej-fase') },
        { label: 'Duracion',     value: getValue('ej-duracion') ? getValue('ej-duracion') + ' min' : '' },
        { label: 'Jugadores',    value: getValue('ej-jugadores') },
        { label: 'Porteros',     value: getValue('ej-porteros') },
        { label: 'Dificultad',   value: dif },
        { label: 'Espacio',      value: espacio },
        { label: 'Material',     value: getValue('ej-material') },
        { label: 'EII',          value: eii }
    ];

    if (campos.length > 0) {
        // Fondo card
        const rows = Math.ceil(campos.length / 3);
        const cardH = rows * 12 + 4;
        doc.setFillColor(...lightBg);
        doc.roundedRect(mL, y, contentW, cardH, 2, 2, 'F');

        let cx = mL + 5;
        let cy = y + 6;
        const colW = (contentW - 10) / 3;

        campos.forEach((c, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const px = mL + 5 + col * colW;
            const py = y + 6 + row * 12;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...gray);
            doc.text(c.label.toUpperCase(), px, py);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...black);
            doc.text(c.value, px, py + 4.5);
        });

        y += cardH + 5;
    }

    // ======================================================
    // SECCIONES DE TEXTO
    // ======================================================
    var sections = [
        { t: 'Objetivos', v: getValue('ej-objetivos') || '—' },
        { t: 'Descripcion / Desarrollo', v: getValue('ej-descripcion') || '—' },
        { t: 'Variantes', v: getValue('ej-variantes') || '—' },
        { t: 'Notas del entrenador', v: getValue('ej-notas') || '—' }
    ];

    var colW2 = (contentW - 6) / 2;
    for (var si = 0; si < sections.length; si += 2) {
        if (y > H - 30) { doc.addPage(); y = 15; }
        for (var ci = 0; ci < 2; ci++) {
            var sec = sections[si + ci];
            if (!sec) break;
            var sx = mL + ci * (colW2 + 6);
            doc.setFillColor(...brand);
            doc.rect(sx, y, 1, 5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...brand);
            doc.text(sec.t, sx + 3, y + 3.5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...dark);
            var lines = doc.splitTextToSize(sec.v, colW2 - 6);
            if (lines.length > 4) lines = lines.slice(0, 4);
            doc.text(lines, sx + 3, y + 8);
        }
        var maxLines = 4;
        y += 8 + maxLines * 3.5 + 4;
    }

    // ======================================================
    // FOOTER
    // ======================================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Línea fina
        doc.setDrawColor(...borderC);
        doc.setLineWidth(0.2);
        doc.line(mL, H - 12, W - mR, H - 12);

        // Banda de color fina
        doc.setFillColor(...brand);
        doc.rect(0, H - 4, W, 4, 'F');

        // Texto footer
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text('TopLiderCoach HUB  |  toplidercoach.com', mL, H - 7);
        doc.text('Pag. ' + i + ' / ' + pageCount, W - mR, H - 7, { align: 'right' });
    }

    // ======================================================
    // GUARDAR
    // ======================================================
    const filename = nombre.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    doc.save('Ejercicio_' + filename + '.pdf');
}
function ejComprimirThumbSVG(svgStr) {
    var campo = '<rect width="800" height="500" fill="#1a6b30"/>'
        + '<clipPath id="fc"><rect x="20" y="15" width="760" height="470" rx="1"/></clipPath>'
        + '<g clip-path="url(#fc)">'
        + '<rect x="20" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="83" y="15" width="64" height="470" fill="#1a6b30"/>'
        + '<rect x="147" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="210" y="15" width="64" height="470" fill="#1a6b30"/>'
        + '<rect x="274" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="337" y="15" width="63" height="470" fill="#1a6b30"/>'
        + '<rect x="400" y="15" width="64" height="470" fill="#207332"/>'
        + '<rect x="464" y="15" width="63" height="470" fill="#1a6b30"/>'
        + '<rect x="527" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="590" y="15" width="64" height="470" fill="#1a6b30"/>'
        + '<rect x="654" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="717" y="15" width="63" height="470" fill="#1a6b30"/>'
        + '</g>'
        + '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<rect x="20" y="15" width="760" height="470" rx="1"/>'
        + '<line x1="400" y1="15" x2="400" y2="485"/>'
        + '<circle cx="400" cy="250" r="65"/>'
        + '<rect x="20" y="133" width="108" height="234"/>'
        + '<rect x="672" y="133" width="108" height="234"/>'
        + '<rect x="20" y="195" width="40" height="110"/>'
        + '<rect x="740" y="195" width="40" height="110"/>'
        + '<rect x="10" y="220" width="10" height="60"/>'
        + '<rect x="780" y="220" width="10" height="60"/>'
        + '<path d="M128 199 A65 65 0 0 1 128 301"/>'
        + '<path d="M672 199 A65 65 0 0 0 672 301"/>'
        + '<path d="M20 22 A7 7 0 0 1 27 15"/>'
        + '<path d="M773 15 A7 7 0 0 1 780 22"/>'
        + '<path d="M780 478 A7 7 0 0 1 773 485"/>'
        + '<path d="M27 485 A7 7 0 0 1 20 478"/>'
        + '</g>'
        + '<circle cx="400" cy="250" r="3.5" fill="#fff"/>'
+ '<circle cx="100" cy="250" r="3.5" fill="#fff"/>'
        + '<circle cx="700" cy="250" r="3.5" fill="#fff"/>';
    return svgStr
        .replace(/<image[^>]*href="data:image\/webp;base64,[^"]*"[^>]*data-bg="1"[^>]*\/>/g, campo)
        .replace(/<image[^>]*data-bg="1"[^>]*href="data:image\/webp;base64,[^"]*"[^>]*\/>/g, campo)
        .replace(/<image[^>]*href="data:image\/svg\+xml;base64,[^"]*"[^>]*data-bg="1"[^>]*\/>/g, campo)
        .replace(/<image[^>]*data-bg="1"[^>]*href="data:image\/svg\+xml;base64,[^"]*"[^>]*\/>/g, campo)
        .substring(0, 50000);
}
function ejPrepararThumbParaPDF() {
    const svgSource = window.ejThumbnailPendiente || (() => {
        const el = document.getElementById('ej-svg');
        return el ? new XMLSerializer().serializeToString(el) : null;
    })();
    if (!svgSource) return;
    const parser = new DOMParser();
    const clone = parser.parseFromString(svgSource, 'image/svg+xml').documentElement;
    clone.setAttribute('width', 800);
    clone.setAttribute('height', 500);
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, 800, 500);
        window._ejPdfThumbData = canvas.toDataURL('image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
async function ejEliminarDesdeBanco(id) {
    const e = ejBancoCache.find(x => x.id === id);
    if (!confirm('¿Eliminar "' + (e ? e.name : '') + '"? No se puede deshacer.')) return;
    try {
        const { error } = await supabaseClient.from('custom_exercises').delete().eq('id', id);
        if (error) throw error;
        ejBancoCache = ejBancoCache.filter(x => x.id !== id);
        ejBancoSearch();
    } catch(err) {
        alert('Error: ' + err.message);
    }
}
async function ejEliminarEjercicio() {
    if (!ejEditandoId) { alert('No hay ejercicio cargado para eliminar'); return; }
    if (!confirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.')) return;
    try {
        const { error } = await supabaseClient.from('custom_exercises').delete().eq('id', ejEditandoId);
        if (error) throw error;
        ejBancoCache = ejBancoCache.filter(x => x.id !== ejEditandoId);
        ejEditandoId = null;
        ejP._lastVideoUrl = null;
        window.ejThumbnailPendiente = null;
        ejLimpiarFicha();
        ejBuildFicha();
        ejShowTab('banco', document.querySelector('[onclick*="\'banco\'"]'));
    } catch(err) {
        alert('Error al eliminar: ' + err.message);
    }
}
function ejCalcEII() {
    const a = parseFloat(document.getElementById('ej-ancho')?.value);
    const l = parseFloat(document.getElementById('ej-largo')?.value);
    const j = parseFloat(document.getElementById('ej-jugadores')?.value);
    const el = document.getElementById('ej-eii-display');
    if (!el) return;
    if (a && l && j) {
        const eii = ((a * l) / j).toFixed(1);
        el.textContent = `EII: ${eii} m²/jug`;
    } else {
        el.textContent = '';
    }
}
async function ejSubirThumbnail(ejercicioId) {
    const svgEl = document.getElementById('ej-pizarra-svg');
    if (!svgEl) return null;
    try {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const res = await fetch('https://toplidercoach.com/wp-content/uploads/ejercicios/upload-thumbnail.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer toplider_thumb_2026'
            },
            body: JSON.stringify({ svg: svgData, id: String(ejercicioId) })
        });
        const data = await res.json();
        return data.ok ? data.url : null;
    } catch (e) {
        console.warn('Error subiendo thumbnail:', e);
        return null;
    }
}
async function ejEditarDibujo() {
    if (!ejEditandoId) {
        alert('Primero guarda el ejercicio para poder editar el dibujo.');
        return;
    }
    try {
        var res = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (res.error) throw res.error;
        var data = res.data;
        if (!data.board_data) {
            // No hay dibujo, abrir pizarra con selector de modo
            var overlay = document.getElementById('ej-modo-overlay');
            if (overlay) overlay.style.display = 'flex';
            var tb = document.getElementById('ej-toolbar');
            if (tb) tb.style.display = 'none';
            ejShowTab('pizarra', document.querySelector('[onclick*="pizarra"]'));
            return;
        }
        // Cargar dibujo
        ejP.players   = data.board_data.players || [];
        ejP.lines     = data.board_data.lines   || [];
        ejP.shapes    = data.board_data.shapes  || [];
        ejP.texts     = data.board_data.texts   || [];
        ejP.equipment = data.board_data.equipment || [];
        ejP.fieldType = data.board_data.fieldType || 'full';
        ejP.selectedId = null;
        ejP._lastVideoUrl = data.animation_url || null;
        
        // Ocultar overlay y mostrar toolbar
        var overlay = document.getElementById('ej-modo-overlay');
        if (overlay) overlay.style.display = 'none';
        var tb = document.getElementById('ej-toolbar');
        if (tb) tb.style.display = '';
        
        // Activar modo correcto
        if (data.board_data.animMode) {
            ejP.animMode = true;
            if (data.board_data.animFrames && data.board_data.animFrames.length > 0) {
                ejP.frames = data.board_data.animFrames;
                ejP.currentFrame = 0;
                ejFrameRestore(ejP.frames[0]);
            }
            var bar = document.getElementById('ej-timeline-bar');
            if (bar) bar.style.display = 'block';
            ejRenderTimeline();
        } else {
            ejP.animMode = false;
            ejP.frames = [];
            ejP.currentFrame = 0;
            var bar = document.getElementById('ej-timeline-bar');
            if (bar) bar.style.display = 'none';
        }
        
        // Mostrar nombre en topbar
        var lbl = document.getElementById('ej-pizarra-nombre-label');
        if (lbl) lbl.textContent = data.name;
        
        ejRenderSVG();
        ejRenderToolbar();
        ejShowTab('pizarra', document.querySelector('[onclick*="pizarra"]'));
    } catch(err) {
        alert('Error al cargar dibujo: ' + err.message);
    }
}
async function ejGuardarEjercicio() {
    const nombre = document.getElementById('ej-nombre')?.value?.trim();
    if (!nombre) { alert('El nombre del ejercicio es obligatorio'); return; }

    const msg = document.getElementById('ej-ficha-msg');
    if (msg) msg.innerHTML = '<span style="color:#9ca3af">Guardando...</span>';

    const a = parseFloat(document.getElementById('ej-ancho')?.value) || null;
    const l = parseFloat(document.getElementById('ej-largo')?.value) || null;
    const j = parseFloat(document.getElementById('ej-jugadores')?.value) || null;
    const eii = (a && l && j) ? parseFloat(((a * l) / j).toFixed(2)) : null;

    // Capturar miniatura del SVG
let thumbnailSvg = window.ejThumbnailPendiente || null;
    if (!thumbnailSvg) {
        const svgEl = document.getElementById('ej-svg');
        if (svgEl) thumbnailSvg = new XMLSerializer().serializeToString(svgEl);
    }
    if (thumbnailSvg) {
        thumbnailSvg = thumbnailSvg
            .replace(/width="[^"]*"/, 'width="100%"')
            .replace(/height="[^"]*"/, 'height="100%"');
    }
    window.ejThumbnailPendiente = null;

    const data = {
        club_id:     window.ejClubId || null,
        coach_id:    window.ejCoachId || null,
        name:        nombre,
        category:    document.getElementById('ej-categoria')?.value || null,
        age_group:   document.getElementById('ej-edad')?.value || null,
        duration_min: parseInt(document.getElementById('ej-duracion')?.value) || null,
        players_count: j,
        difficulty:  document.getElementById('ej-dificultad')?.value || null,
        game_phase:  document.getElementById('ej-fase')?.value || null,
        objectives:  document.getElementById('ej-objetivos')?.value || null,
        description: document.getElementById('ej-descripcion')?.value || null,
        variants:    document.getElementById('ej-variantes')?.value || null,
        coach_notes: document.getElementById('ej-notas')?.value || null,
        field_width:  a, field_length: l, field_area: (a && l ? a*l : null),
        eii,
        materials:   document.getElementById('ej-material')?.value || null,
        tema:        document.getElementById('ej-tema')?.value || null,
        num_goalkeepers: parseInt(document.getElementById('ej-porteros')?.value) || null,
        board_data:  ejP.players.length > 0 ? {
            players: ejP.players, lines: ejP.lines,
            shapes: ejP.shapes, texts: ejP.texts,
            equipment: ejP.equipment,
            fieldType: ejP.fieldType,
            animFrames: ejP.animMode ? ejP.frames : [],
            animMode: ejP.animMode
        } : null,
        thumbnail_svg: thumbnailSvg ? ejComprimirThumbSVG(thumbnailSvg) : null,
        
        source: 'custom'
    };

 try {
        let res, error;
        if (ejEditandoId) {
            // Actualizar ejercicio existente
            ({ data: res, error } = await supabaseClient
                .from('custom_exercises').update(data).eq('id', ejEditandoId).select());
        } else {
            // Crear nuevo ejercicio
            ({ data: res, error } = await supabaseClient
                .from('custom_exercises').insert([data]).select());
        }
        if (error) throw error;
        if (res && res[0]) {
            ejEditandoId = res[0].id;
            if (ejP.players.length > 0) {
                const thumbUrl = await ejSubirThumbnail(ejEditandoId);
                if (thumbUrl) {
                    await supabaseClient.from('custom_exercises').update({ thumbnail_url: thumbUrl }).eq('id', ejEditandoId);
                }
            }
        }
        // Actualizar caché local para que el Banco refleje los cambios al instante
        if (res && res[0]) {
            const idx = ejBancoCache.findIndex(x => x.id === res[0].id);
            if (idx >= 0) ejBancoCache[idx] = { ...ejBancoCache[idx], ...res[0] };
            else ejBancoCache.unshift(res[0]);
        }
        var videoAviso = ejP.animMode ? '<br><span style="color:#f97316">⚠️ Si has hecho cambios en la animación, pulsa MP4 en la pizarra para actualizar el vídeo.</span>' : '';
        setTimeout(() => { if (msg) msg.innerHTML = ''; }, 6000);
    } catch(err){
        console.error(err);
        if (msg) msg.innerHTML = `<span style="color:#ef4444">❌ Error: ${err.message}</span>`;
    }
}

function ejLimpiarFicha() {
    ejEditandoId = null;
    ['ej-nombre','ej-objetivos','ej-descripcion','ej-variantes','ej-notas','ej-material',
     'ej-duracion','ej-jugadores','ej-ancho','ej-largo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['ej-categoria','ej-edad','ej-dificultad','ej-fase'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
    const eii = document.getElementById('ej-eii-display');
    if (eii) eii.textContent = '';
    var nombreInput = document.getElementById('ej-nombre');
    if (nombreInput) { nombreInput.readOnly = false; nombreInput.style.background = ''; nombreInput.style.color = ''; }
    var lockMsg = document.getElementById('ej-nombre-lock-msg');
    if (lockMsg) lockMsg.style.display = 'none';
}

// =============================================
// SECCIÓN BANCO DE EJERCICIOS
// =============================================
function ejBuildBanco() {
    const root = document.getElementById('ej-banco-container');
    if (!root) return;
    root.innerHTML = `
    <div class="ej-banco-wrap">
        <h3 class="ej-ficha-title" style="margin-bottom:12px">🗂 Banco de ejercicios</h3>
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:12px 14px;margin-bottom:14px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                <input type="text" id="ej-search" placeholder="🔍 Buscar por nombre..." oninput="ejBancoSearch()" style="flex:1">
                <span id="ej-banco-count" style="font-size:11px;background:#1e3a5f;color:#93c5fd;padding:3px 10px;border-radius:6px;white-space:nowrap"></span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <select id="ej-filter-tema" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Tema ▾</option>
                    <option>Calentamiento</option><option>Cambios de orientación</option><option>Centros laterales</option>
                    <option>Contraataque</option><option>Defensa en bloque bajo</option><option>Defensa en inferioridad</option>
                    <option>Duelos</option><option>Finalización</option><option>Físico-Técnico</option>
                    <option>Juego de posición</option><option>Juego interior</option><option>Juegos Lúdicos</option>
                    <option>Partidos</option><option>Porteros</option><option>Posesiones</option>
                    <option>Presión</option><option>Press perdida</option><option>Progresión en el juego</option>
                    <option>Rondos</option><option>Ruedas de pases</option><option>Salida de balón</option>
                    <option>Tercer hombre</option><option>Trabajo táctico</option><option>Transiciones</option>
                    <option>Técnica individual</option>
                </select>
                <select id="ej-filter-cat" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Categoría ▾</option>
                    <option>Técnica individual</option><option>Posesión</option><option>Pressing</option>
                    <option>Ataque posicional</option><option>Defensa</option><option>Transiciones</option>
                    <option>Portería</option><option>Físico</option><option>Táctica</option>
                </select>
                <select id="ej-filter-edad" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Edad ▾</option>
                    <option>Prebenjamín</option><option>Benjamín</option><option>Alevín</option>
                    <option>Infantil</option><option>Cadete</option><option>Juvenil</option><option>Senior</option>
                </select>
                <select id="ej-filter-dif" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Dificultad ▾</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                    <option value="4">4</option><option value="5">5</option>
                </select>
                <select id="ej-filter-fase" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Fase ▾</option>
                    <option>Organización ofensiva</option><option>Organización defensiva</option>
                    <option>Transición ataque</option><option>Transición defensa</option><option>Balón parado</option>
                </select>
                <input type="number" id="ej-filter-jug" placeholder="Jugadores" min="1" max="30" oninput="ejBancoSearch()" style="width:75px;padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px">
                <input type="number" id="ej-filter-port" placeholder="Porteros" min="0" max="4" oninput="ejBancoSearch()" style="width:70px;padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px">
                <input type="number" id="ej-filter-dur" placeholder="Min." min="1" oninput="ejBancoSearch()" style="width:55px;padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px">
                <button onclick="ejLimpiarFiltros()" style="padding:4px 10px;font-size:11px;background:#334155;border:none;color:#94a3b8;border-radius:6px;cursor:pointer;white-space:nowrap">✕ Limpiar</button>
            </div>
        </div>
        
        <div id="ej-banco-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;overflow:hidden">
            <div style="color:#9ca3af;padding:20px">Cargando ejercicios...</div>
        </div>
    </div>`;
    ejBancoLoad();
}
let ejBancoCache = [];
let ejEditandoId = null;

async function ejBancoLoad() {
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises')
            .select('id,name,category,age_group,difficulty,duration_min,players_count,game_phase,field_width,field_length,eii,objectives,description,variants,coach_notes,materials,thumbnail_svg,animation_url,tema,num_goalkeepers')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) throw error;
        ejEditandoId = data.id;
        ejBancoCache = data || [];
        ejBancoRender(ejBancoCache);
    } catch(err) {
        const grid = document.getElementById('ej-banco-grid');
        if (grid) grid.innerHTML = `<div style="color:#ef4444">Error: ${err.message}</div>`;
    }
}

function ejLimpiarFiltros() {
    ['ej-search','ej-filter-jug','ej-filter-port','ej-filter-dur'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    ['ej-filter-tema','ej-filter-cat','ej-filter-edad','ej-filter-dif','ej-filter-fase'].forEach(id => {
        const el = document.getElementById(id); if (el) el.selectedIndex = 0;
    });
    ejBancoSearch();
}
 
function ejBancoSearch() {
    const q    = document.getElementById('ej-search')?.value?.toLowerCase() || '';
    const tema = document.getElementById('ej-filter-tema')?.value || '';
    const cat  = document.getElementById('ej-filter-cat')?.value || '';
    const edad = document.getElementById('ej-filter-edad')?.value || '';
    const dif  = document.getElementById('ej-filter-dif')?.value || '';
    const fase = document.getElementById('ej-filter-fase')?.value || '';
    const jug  = parseInt(document.getElementById('ej-filter-jug')?.value) || 0;
    const port = parseInt(document.getElementById('ej-filter-port')?.value) || 0;
    const dur  = parseInt(document.getElementById('ej-filter-dur')?.value) || 0;
    const filtered = ejBancoCache.filter(e =>
        (!q    || e.name?.toLowerCase().includes(q)) &&
        (!tema || e.tema === tema) &&
        (!cat  || e.category === cat) &&
        (!edad || e.age_group === edad) &&
        (!dif  || String(e.difficulty) === dif) &&
        (!fase || e.game_phase === fase) &&
        (!jug  || e.players_count == jug) &&
        (!port || e.num_goalkeepers == port) &&
        (!dur  || e.duration_min == dur)
    );
    const countEl = document.getElementById('ej-banco-count');
    if (countEl) countEl.textContent = filtered.length + ' ejercicio' + (filtered.length !== 1 ? 's' : '');
    ejBancoRender(filtered);
}

function ejBancoRender(list) {
    const grid = document.getElementById('ej-banco-grid');
    if (!grid) return;

    var MAX = 100;
    if (list.length > MAX) list = list.slice(0, MAX);
    var countEl = document.getElementById('ej-banco-count');
    if (countEl) countEl.textContent = list.length + ' ejercicio' + (list.length !== 1 ? 's' : '');

    if (!list.length) {
        grid.innerHTML = '<div style="color:#64748b;padding:30px;text-align:center;grid-column:1/-1">No hay ejercicios con estos filtros.</div>';
        return;
    }

    var difColors = {'1':'#22c55e','2':'#22c55e','3':'#eab308','4':'#f97316','5':'#ef4444'};
    var html = '';

    for (var idx = 0; idx < list.length; idx++) {
        var e = list[idx];
        var difCol = difColors[e.difficulty] || '#6b7280';
        var tags = [];
        if (e.tema) tags.push(e.tema);
        if (e.age_group) tags.push(e.age_group);
        if (e.duration_min) tags.push(e.duration_min + 'min');
        if (e.players_count) tags.push(e.players_count + ' jug');
        var borderR = (idx % 4 !== 3) ? 'border-right:1px solid #1e3a5f;' : '';
        var tagsHTML = '';
        for (var t = 0; t < tags.length; t++) {
            tagsHTML += '<span style="font-size:10px;color:#94a3b8;background:#1e293b;padding:1px 6px;border-radius:4px">' + tags[t] + '</span>';
        }

        var thumbHTML;
        if (e.thumbnail_url) {
            thumbHTML = '<img src="' + e.thumbnail_url + '" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"/>';
        } else if (e.thumbnail_svg) {
            thumbHTML = '<img data-svg-idx="' + idx + '" style="width:100%;height:100%;object-fit:cover;display:block;background:#0f4c2a" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>';
        } else {
            thumbHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#475569;font-size:11px">sin dibujo</div>';
        }

        html += '<div style="padding:12px;' + borderR + 'border-bottom:1px solid #1e3a5f;min-width:0;overflow:hidden">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px">'
            + '<span style="font-size:13px;font-weight:600;color:#e2e8f0;line-height:1.3;flex:1;margin-right:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + e.name + '</span>'
            + (e.difficulty ? '<span style="font-size:10px;background:' + difCol + '20;color:' + difCol + ';padding:1px 7px;border-radius:4px;flex-shrink:0">' + e.difficulty + '</span>' : '')
            + '</div>'
            + '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">' + tagsHTML + '</div>'
            + '<div onclick="ejVerFicha(\'' + e.id + '\')" style="width:100%;aspect-ratio:8/5;overflow:hidden;border-radius:6px;margin-bottom:8px;background:#0f4c2a;cursor:pointer">'
            + thumbHTML
            + '</div>'
            + '<div style="display:flex;gap:4px">'
            + '<button onclick="ejVerFicha(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#93c5fd;border-radius:6px;cursor:pointer">Ver ficha</button>'
            + '<button onclick="ejBancoCargar(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">Editar</button>'
            + '<button onclick="ejEliminarDesdeBanco(\'' + e.id + '\')" style="padding:5px 6px;font-size:11px;background:#1e293b;border:1px solid #7f1d1d;color:#fca5a5;border-radius:6px;cursor:pointer" title="Eliminar">🗑</button>'
            + '</div>'
            + '</div>';
    }

    grid.innerHTML = html;

    // Convertir SVGs a Blob URLs (fiable con cualquier tamaño)
    setTimeout(function() {
        var imgs = grid.querySelectorAll('img[data-svg-idx]');
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var svgIdx = parseInt(img.getAttribute('data-svg-idx'));
            var ex = list[svgIdx];
            if (ex && ex.thumbnail_svg) {
                try {
                    var blob = new Blob([ex.thumbnail_svg], {type: 'image/svg+xml'});
                    img.src = URL.createObjectURL(blob);
                } catch(err) {
                    console.warn('Error creando blob para thumbnail:', err);
                }
            }
        }
    }, 100);
}
async function ejVerFicha(id) {
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises').select('*').eq('id', id).single();
        if (error) throw error;
        ejEditandoId = data.id;
        const set = (fid, val) => { const el = document.getElementById(fid); if (el && val) el.value = val; };
        set('ej-nombre', data.name);
        var nombreInput = document.getElementById('ej-nombre');
        if (nombreInput) { nombreInput.readOnly = true; nombreInput.style.background = '#1e293b'; nombreInput.style.color = '#64748b'; }
        var lockMsg = document.getElementById('ej-nombre-lock-msg');
        if (lockMsg) lockMsg.style.display = 'block';
        set('ej-categoria', data.category);
        set('ej-edad', data.age_group);
        set('ej-duracion', data.duration_min);
        set('ej-jugadores', data.players_count);
        set('ej-dificultad', data.difficulty);
        set('ej-fase', data.game_phase);
        set('ej-objetivos', data.objectives);
        set('ej-descripcion', data.description);
        set('ej-variantes', data.variants);
        set('ej-notas', data.coach_notes);
        set('ej-material', data.materials);
        set('ej-tema', data.tema);
        set('ej-porteros', data.num_goalkeepers);
        set('ej-ancho', data.field_width);
        set('ej-largo', data.field_length);
        ejCalcEII();
        if (data.thumbnail_svg) window.ejThumbnailPendiente = data.thumbnail_svg;
        ejP._lastVideoUrl = data.animation_url || null;
        ejShowTab('ficha', document.querySelector('[onclick*="\'ficha\'"]'));
        setTimeout(() => { ejActualizarFichaMedia(); ejPrepararThumbParaPDF(); }, 300);
    } catch(err) {
        alert('Error al cargar: ' + err.message);
    }
}
async function ejBancoCargar(id) {
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises').select('*').eq('id', id).single();
        if (error) throw error;
        if (data.board_data) {
            ejSaveHistory();
            ejP.players   = data.board_data.players || [];
            ejP.lines     = data.board_data.lines   || [];
            ejP.shapes    = data.board_data.shapes  || [];
            ejP.texts     = data.board_data.texts   || [];
            ejP.equipment = data.board_data.equipment || [];
            ejP.fieldType = data.board_data.fieldType || 'full';
            ejP.selectedId = null;
            ejEditandoId = data.id;
            ejP._lastVideoUrl = data.animation_url || null;
            // Restaurar animación si existe
            if (data.board_data.animFrames && data.board_data.animFrames.length > 0) {
                ejP.frames = data.board_data.animFrames;
                ejP.currentFrame = 0;
                ejP.animMode = data.board_data.animMode || false;
                ejFrameRestore(ejP.frames[0]);
                const bar = document.getElementById('ej-timeline-bar');
                if (bar) bar.style.display = ejP.animMode ? 'block' : 'none';
                ejRenderTimeline();
                ejRenderToolbar();
            }
            ejRenderSVG();
        }
        // Rellenar ficha
        const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        set('ej-nombre', data.name);
        set('ej-categoria', data.category);
        set('ej-edad', data.age_group);
        set('ej-duracion', data.duration_min);
        set('ej-jugadores', data.players_count);
        set('ej-dificultad', data.difficulty);
        set('ej-fase', data.game_phase);
        set('ej-objetivos', data.objectives);
        set('ej-descripcion', data.description);
        set('ej-variantes', data.variants);
        set('ej-notas', data.coach_notes);
        set('ej-material', data.materials);
        set('ej-tema', data.tema);
        set('ej-porteros', data.num_goalkeepers);
        set('ej-ancho', data.field_width);
        set('ej-largo', data.field_length);
        ejCalcEII();
        ejP._lastVideoUrl = data.animation_url || null;
        setTimeout(() => ejActualizarFichaMedia(), 500);

     
        ejShowTab('ficha', document.querySelector('[onclick*="\'ficha\'"]'));
        setTimeout(() => { ejActualizarFichaMedia(); ejPrepararThumbParaPDF(); }, 300);
        // Mostrar barra con nombre del ejercicio cargado
        const bar = document.getElementById('ej-pizarra-topbar');
        const lbl = document.getElementById('ej-pizarra-nombre-label');
        if (bar && lbl) { lbl.textContent = data.name; bar.style.display = 'flex'; }
    } catch(err) {
        alert('Error al cargar: ' + err.message);
    }
}

// =============================================
// MODAL FICHA EJERCICIO
// =============================================
function ejAbrirModal(id) {
    const e = ejBancoCache.find(x => x.id === id);
    if (!e) return;

    const difColor = { basico: '#22c55e', medio: '#eab308', avanzado: '#ef4444' };

    // Eliminar modal previo si existe
    const prev = document.getElementById('ej-modal-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ej-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px)';

    const difBadge = e.difficulty
        ? `<span style="font-size:11px;background:${difColor[e.difficulty]||'#6b7280'}25;color:${difColor[e.difficulty]||'#9ca3af'};padding:2px 10px;border-radius:10px;margin-left:8px;border:1px solid ${difColor[e.difficulty]||'#6b7280'}40">${e.difficulty}</span>`
        : '';

    const metaTags = [
        e.category    && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">📁 ${e.category}</span>`,
        e.age_group   && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">🎂 ${e.age_group}</span>`,
        e.duration_min && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">⏱ ${e.duration_min} min</span>`,
        e.players_count && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">👥 ${e.players_count} jug.</span>`,
        e.game_phase  && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">⚽ ${e.game_phase}</span>`,
        e.eii         && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">📐 EII: ${e.eii} m²/jug</span>`,
        e.materials   && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">🧰 ${e.materials}</span>`
    ].filter(Boolean).join('');

    function infoBlock(label, icon, value) {
        if (!value) return '';
        return `<div style="background:#0f172a;border-radius:8px;padding:10px 12px">
            <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">${icon} ${label}</div>
            <div style="color:#e2e8f0;font-size:13px;line-height:1.5">${value}</div>
        </div>`;
    }

    overlay.innerHTML = `
    <div style="background:#1e293b;border-radius:14px;max-width:920px;width:100%;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 25px 60px rgba(0,0,0,.6)">

        <!-- Header -->
        <div style="padding:20px 24px 16px;border-bottom:1px solid #334155;display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div>
                <h2 style="color:#f8fafc;margin:0 0 8px;font-size:20px;font-weight:700">${e.name}${difBadge}</h2>
                <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px;color:#94a3b8">${metaTags || '<span style="color:#475569">Sin categoría</span>'}</div>
            </div>
            <button id="ej-modal-close" style="background:#334155;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center">✕</button>
        </div>

        <!-- Body -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

            <!-- Columna izquierda: dibujo -->
            <div style="padding:20px 12px 20px 24px;border-right:1px solid #334155">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">🎨 Pizarra táctica</div>
                <div id="ej-modal-svg-container" style="width:100%;aspect-ratio:8/5;overflow:hidden;border-radius:10px;background:#0f4c2a;margin-bottom:14px;box-shadow:inset 0 2px 8px rgba(0,0,0,.4)">
                    <div style="color:#475569;font-size:12px;display:flex;align-items:center;justify-content:center;height:100%">Sin dibujo guardado</div>
                </div>
                <button id="ej-modal-cargar-btn" style="width:100%;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">
                    📋 Cargar en pizarra
                </button>
            ${e.animation_url ? `
                <div style="margin-top:10px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎬 Animación del ejercicio</div>
                    <video src="${e.animation_url}" controls playsinline loop style="width:100%;border-radius:8px;background:#000"></video>
<a href="https://toplidercoach.com/wp-content/uploads/ejercicios/download-video.php?url=${encodeURIComponent(e.animation_url)}" target="_blank" style="display:block;width:100%;margin-top:8px;padding:10px;background:#f97316;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;text-align:center;text-decoration:none">
                    </a>
                </div>` : ''}

            <!-- Columna derecha: info -->
            <div style="padding:20px 24px 20px 12px;display:flex;flex-direction:column;gap:8px">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">📄 Detalles del ejercicio</div>
                ${infoBlock('Objetivos', '🎯', e.objectives)}
                ${infoBlock('Descripción', '📝', e.description)}
                ${infoBlock('Variantes', '🔀', e.variants)}
                ${infoBlock('Notas del entrenador', '💬', e.coach_notes)}
                ${!e.objectives && !e.description && !e.variants && !e.coach_notes
                    ? '<div style="color:#475569;font-size:13px;padding:20px 0">Sin información adicional.</div>'
                    : ''}
            </div>
        </div>

        <!-- Footer -->
        <div style="padding:14px 24px;border-top:1px solid #334155;display:flex;justify-content:flex-end;gap:8px">
            <button id="ej-modal-eliminar-btn" style="padding:8px 16px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:8px;cursor:pointer;font-size:12px">🗑 Eliminar</button>
            <button id="ej-modal-cerrar-btn" style="padding:8px 16px;background:#334155;border:none;color:#cbd5e1;border-radius:8px;cursor:pointer;font-size:12px">Cerrar</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);

    // Insertar SVG de forma segura (evita romper el template si contiene backticks)
    if (e.thumbnail_svg) {
        const svgContainer = document.getElementById('ej-modal-svg-container');
        if (svgContainer) svgContainer.innerHTML = e.thumbnail_svg;
    }

    // Eventos de botones via addEventListener (sin problemas de escapado)
    document.getElementById('ej-modal-close').addEventListener('click', () => overlay.remove());
    document.getElementById('ej-modal-cerrar-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', ev => { if (ev.target === overlay) overlay.remove(); });

    document.getElementById('ej-modal-cargar-btn').addEventListener('click', () => {
        ejBancoCargar(e.id);
        overlay.remove();
    });

    document.getElementById('ej-modal-eliminar-btn').addEventListener('click', async () => {
        if (!confirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabaseClient.from('custom_exercises').delete().eq('id', e.id);
            if (error) throw error;
            overlay.remove();
            ejBancoCache = ejBancoCache.filter(x => x.id !== e.id);
            ejBancoRender(ejBancoCache);
        } catch(err) {
            alert('Error al eliminar: ' + err.message);
        }
    });
}
// =============================================
// SISTEMA DE ANIMACIÓN POR FRAMES
// =============================================

function ejToggleAnimMode() {
    ejP.animMode = !ejP.animMode;
    if (ejP.animMode) {
        ejP.activeTool = 'select';  
        // Al activar: guardar estado actual como frame 0
        ejP.frames = [ejFrameSnapshot()];
        ejP.currentFrame = 0;
        ejP.isPlaying = false;
    } else {
        // Al desactivar: parar reproducción
        ejFrameStop();
        ejP.frames = [];
        ejP.currentFrame = 0;
    }
    const bar = document.getElementById('ej-timeline-bar');
    if (bar) bar.style.display = ejP.animMode ? 'block' : 'none';
    ejRenderTimeline();
    ejRenderToolbar();
}

// Captura las posiciones actuales de jugadores y equipamiento
function ejFrameSnapshot() {
    return {
        players: ejP.players.map(p => ({ id: p.id, x: p.x, y: p.y })),
        equipment: ejP.equipment.map(eq => ({ id: eq.id, x: eq.x, y: eq.y })),
        trajectories: []
    };
}

// Restaura posiciones desde un frame guardado
function ejFrameRestore(frame) {
    if (!frame) return;
    for (const fp of frame.players) {
        const p = ejP.players.find(pl => pl.id === fp.id);
        if (p) { p.x = fp.x; p.y = fp.y; }
    }
    for (const fe of frame.equipment) {
        const eq = ejP.equipment.find(e => e.id === fe.id);
        if (eq) { eq.x = fe.x; eq.y = fe.y; }
    }
}

// Guarda el estado actual en el frame actual
function ejFrameSaveCurrent() {
    if (!ejP.animMode || ejP.frames.length === 0) return;
    const existing = ejP.frames[ejP.currentFrame];
    const snap = ejFrameSnapshot();
    // Preservar trayectorias y undoStack al guardar posiciones
    snap.trajectories = existing ? (existing.trajectories || []) : [];
    snap.undoStack = existing ? (existing.undoStack || []) : [];
    ejP.frames[ejP.currentFrame] = snap;
}

// Añade un nuevo frame (clona posiciones del frame actual)
function ejFrameAdd() {
    if (!ejP.animMode) return;
    if (ejP.animMode) ejP._videoDesactualizado = true;
    ejFrameSaveCurrent();
    // Aplicar trayectorias: mover elementos a su destino
    const cf = ejP.frames[ejP.currentFrame];
    if (cf && cf.trajectories) {
        for (const traj of cf.trajectories) {
            if (!traj.isMovement || traj.toX === undefined) continue;
            const pl = ejP.players.find(p => p.id === traj.linkedId);
            if (pl) { pl.x = traj.toX; pl.y = traj.toY; }
            const eq = ejP.equipment.find(e => e.id === traj.linkedId);
            if (eq) { eq.x = traj.toX; eq.y = traj.toY; }
        }
    }
    const newFrame = ejFrameSnapshot();
    ejP.frames.push(newFrame);
    ejP.currentFrame = ejP.frames.length - 1;
    ejRenderSVG();
    ejRenderTimeline();
}

// Elimina el último frame
function ejFrameDeleteLast() {
    if (!ejP.animMode || ejP.frames.length <= 1) return;
    if (!confirm('¿Eliminar el último frame?')) return;
    ejP.frames.pop();
    if (ejP.currentFrame >= ejP.frames.length) {
        ejP.currentFrame = ejP.frames.length - 1;
    }
    ejFrameRestore(ejP.frames[ejP.currentFrame]);
    ejRenderSVG();
    ejRenderTimeline();
}
function ejFrameUndoTraj() {
    if (!ejP.animMode) return;
    const frame = ejP.frames[ejP.currentFrame];
    if (!frame || !frame.undoStack || frame.undoStack.length === 0) return;
    const action = frame.undoStack.pop();
    if (frame.trajectories) frame.trajectories = frame.trajectories.filter(t => t.id !== action.trajId);
    ejRenderSVG();
    ejRenderTimeline();
}
// Navega a un frame específico
function ejFrameGo(idx) {
    if (!ejP.animMode || idx < 0 || idx >= ejP.frames.length) return;
    if (ejP.isPlaying) ejFrameStop();
    // Guardar posiciones actuales antes de cambiar
    ejFrameSaveCurrent();
    ejP.currentFrame = idx;
    ejFrameRestore(ejP.frames[idx]);
    ejRenderSVG();
    ejRenderTimeline();
}

function ejFramePrev() {
    if (ejP.currentFrame > 0) ejFrameGo(ejP.currentFrame - 1);
}

function ejFrameNext() {
    if (ejP.currentFrame < ejP.frames.length - 1) ejFrameGo(ejP.currentFrame + 1);
}

// Reproducción
function ejFramePlay(fromFrame) {
    if (!ejP.animMode || ejP.frames.length < 2) return;
    ejFrameSaveCurrent();
    const startIdx = (fromFrame !== undefined) ? fromFrame : ejP.currentFrame;
    if (startIdx >= ejP.frames.length - 1) {
        ejP.currentFrame = 0;
        ejFrameRestore(ejP.frames[0]);
        ejRenderSVG();
    } else {
        ejP.currentFrame = startIdx;
    }
    ejP.isPlaying = true;
    ejP._animFrame = ejP.currentFrame;
    ejP._animProgress = 0;
    ejP._animLastTime = performance.now();
    ejP._animId = requestAnimationFrame(ejFrameAnimate);
    ejRenderTimeline();
}

function ejFrameStop() {
    ejP.isPlaying = false;
    if (ejP._animId) {
        cancelAnimationFrame(ejP._animId);
        ejP._animId = null;
    }
    // Restaurar el frame actual limpio
    if (ejP.frames[ejP.currentFrame]) {
        ejFrameRestore(ejP.frames[ejP.currentFrame]);
        ejRenderSVG();
    }
    ejRenderTimeline();
}

// Loop de animación con interpolación suave
function ejFrameAnimate(now) {
    if (!ejP.isPlaying) return;
    const dt = now - ejP._animLastTime;
    ejP._animLastTime = now;
    ejP._animProgress += dt / (ejP.playSpeed * 0.7);

    if (ejP._animProgress >= 1) {
        // Pasar al siguiente frame
        ejP._animProgress = 0;
        ejP._animFrame++;
        ejP.currentFrame = ejP._animFrame;

        if (ejP._animFrame >= ejP.frames.length - 1) {
            // Llegamos al final
            ejP.currentFrame = ejP.frames.length - 1;
            ejFrameRestore(ejP.frames[ejP.currentFrame]);
            ejRenderSVG();
            ejFrameStop();
            return;
        }
    }

    // Interpolar entre frame actual y siguiente
    const fA = ejP.frames[ejP._animFrame];
    const fB = ejP.frames[ejP._animFrame + 1];
    if (!fA || !fB) { ejFrameStop(); return; }

    const t = ejP._animProgress;
    // Ease in-out cuadrático
    const ease = t * t * t * (t * (t * 6 - 15) + 10);

    // Interpolar jugadores (siguiendo trayectoria freehand si existe)
    for (const pa of fA.players) {
        const pb = fB.players.find(p => p.id === pa.id);
        const player = ejP.players.find(p => p.id === pa.id);
        if (!pb || !player) continue;
        const trajFree = (fA.trajectories || []).find(tr =>
            tr.isMovement && tr.linkedId === pa.id && tr.type === 'freehand' && tr.points && tr.points.length > 1
        );
        const trajCurved = (fA.trajectories || []).find(tr =>
            tr.isMovement && tr.linkedId === pa.id && tr.type === 'curved'
        );
        if (trajFree) {
            const pts = trajFree.points;
            const pos = ease * (pts.length - 1);
            const idx = Math.min(Math.floor(pos), pts.length - 2);
            const frac = pos - idx;
            player.x = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
            player.y = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;
        } else if (trajCurved) {
            const t = ease;
            const cx = trajCurved.cx ?? (trajCurved.x1 + trajCurved.x2) / 2;
            const cy = trajCurved.cy ?? (trajCurved.y1 + trajCurved.y2) / 2 - 40;
            player.x = (1-t)*(1-t)*trajCurved.x1 + 2*(1-t)*t*cx + t*t*trajCurved.x2;
            player.y = (1-t)*(1-t)*trajCurved.y1 + 2*(1-t)*t*cy + t*t*trajCurved.y2;
        } else {
            player.x = pa.x + (pb.x - pa.x) * ease;
            player.y = pa.y + (pb.y - pa.y) * ease;
        }
    }
    // Interpolar equipamiento (siguiendo trayectoria freehand si existe)
    for (const ea of fA.equipment) {
        const eb = fB.equipment.find(e => e.id === ea.id);
        const eq = ejP.equipment.find(e => e.id === ea.id);
        if (!eb || !eq) continue;
        const trajFreeEq = (fA.trajectories || []).find(tr =>
            tr.isMovement && tr.linkedId === ea.id && tr.type === 'freehand' && tr.points && tr.points.length > 1
        );
        const trajCurvedEq = (fA.trajectories || []).find(tr =>
            tr.isMovement && tr.linkedId === ea.id && tr.type === 'curved'
        );
        if (trajFreeEq) {
            const pts = trajFreeEq.points;
            const pos = ease * (pts.length - 1);
            const idx = Math.min(Math.floor(pos), pts.length - 2);
            const frac = pos - idx;
            eq.x = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
            eq.y = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;
        } else if (trajCurvedEq) {
            const t = ease;
            const cx = trajCurvedEq.cx ?? (trajCurvedEq.x1 + trajCurvedEq.x2) / 2;
            const cy = trajCurvedEq.cy ?? (trajCurvedEq.y1 + trajCurvedEq.y2) / 2 - 40;
            eq.x = (1-t)*(1-t)*trajCurvedEq.x1 + 2*(1-t)*t*cx + t*t*trajCurvedEq.x2;
            eq.y = (1-t)*(1-t)*trajCurvedEq.y1 + 2*(1-t)*t*cy + t*t*trajCurvedEq.y2;
        } else {
            eq.x = ea.x + (eb.x - ea.x) * ease;
            eq.y = ea.y + (eb.y - ea.y) * ease;
        }
    }

    ejRenderSVG();
    ejRenderTimeline();
    ejP._animId = requestAnimationFrame(ejFrameAnimate);
}

function ejFrameSetSpeed(ms) {
    ejP.playSpeed = ms;
    ejRenderTimeline();
}

// Renderiza la barra de timeline
function ejRenderTimeline() {
    const bar = document.getElementById('ej-timeline-bar');
    if (!bar || !ejP.animMode) return;

    const total = ejP.frames.length;
    const cur = ejP.currentFrame;

    let dots = '';
    for (let i = 0; i < total; i++) {
        const active = i === cur;
        dots += `<div onclick="ejFrameGo(${i})" style="
            width:${active?'28px':'20px'};height:${active?'28px':'20px'};
            border-radius:50%;
            background:${active?'#3b82f6':'#334155'};
            border:2px solid ${active?'#93c5fd':'#475569'};
            cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            font-size:${active?'11px':'9px'};color:${active?'#fff':'#9ca3af'};
            font-weight:${active?'700':'400'};
            transition:all .15s ease;
            flex-shrink:0;
        " title="Frame ${i+1}">${i+1}</div>`;
    }

    bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px">
            ${ejP.isPlaying
                ? '<button onclick="ejFrameStop()" style="background:#ef4444;border:none;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">⏹ Stop</button>'
                : '<button onclick="ejFramePlay()" style="background:#22c55e;border:none;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600" ' + (total<2?'disabled':'') + '>▶ Play</button>'
            }
            <button onclick="ejFramePrev()" style="background:#1e3a5f;border:1px solid #2563eb;color:#93c5fd;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:12px" ${cur<=0?'disabled':''}>◀</button>
            <button onclick="ejFrameNext()" style="background:#1e3a5f;border:1px solid #2563eb;color:#93c5fd;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:12px" ${cur>=total-1?'disabled':''}>▶</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex:1;overflow-x:auto;padding:4px 0">
            ${dots}
        </div>
        <div style="display:flex;align-items:center;gap:4px">
<button onclick="ejFrameAdd()" style="background:#7c3aed;border:none;color:#fff;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">+ Frame</button>
            <button onclick="ejFrameDeleteLast()" style="background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:11px" ${total<=1?'disabled':''}>🗑 Frame</button>
            <button onclick="ejFrameUndoTraj()" style="background:#1e3a5f;border:1px solid #2563eb;color:#93c5fd;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:11px" title="Deshacer última trayectoria del frame">↩ Trayo</button>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
            <span style="color:#64748b;font-size:10px">Vel:</span>
            <button onclick="ejFrameSetSpeed(1500)" style="background:${ejP.playSpeed>=1500?'#1e3a5f':'#0f172a'};border:1px solid #334155;color:#9ca3af;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:10px">0.5x</button>
            <button onclick="ejFrameSetSpeed(800)" style="background:${ejP.playSpeed>=800&&ejP.playSpeed<1500?'#1e3a5f':'#0f172a'};border:1px solid #334155;color:#9ca3af;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:10px">1x</button>
            <button onclick="ejFrameSetSpeed(400)" style="background:${ejP.playSpeed<800?'#1e3a5f':'#0f172a'};border:1px solid #334155;color:#9ca3af;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:10px">2x</button>
        </div>
        <span style="color:#64748b;font-size:11px;white-space:nowrap">Frame ${cur+1}/${total}</span>
        ${ejEditandoId ? `<button onclick="ejGuardarYExportar()" style="background:#22c55e;border:none;color:#fff;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">${ejP._exportingVideo ? '⏳ Generando...' : '💾 Guardar cambios'}</button>` : `<button onclick="ejExportarAnimacionMP4()" style="background:#f97316;border:none;color:#fff;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">${ejP._exportingVideo ? '⏳ Generando...' : '🎬 MP4'}</button>`}
    </div>
    <div id="ej-anim-msg" style="font-size:11px;color:#9ca3af;margin-top:4px;text-align:center">${ejP._exportingVideo ? '⏳ Generando vídeo... (no toques nada)' : ejP._lastVideoUrl ? '<span style="color:#22c55e">✅ Vídeo MP4 guardado</span> — <a href="'+ejP._lastVideoUrl+'" target="_blank" style="color:#93c5fd;text-decoration:underline">Ver vídeo ▶</a> · <a href="https://toplidercoach.com/wp-content/uploads/ejercicios/download-video.php?url='+encodeURIComponent(ejP._lastVideoUrl)+'" target="_blank" style="color:#f97316;text-decoration:underline">📥 Descargar</a>' : ''}</div>`;
}
async function ejCargarPlantilla() {
    try {
        // Obtener temporada activa
        // Buscar temporada activa del club actual
        // Usar variables globales del sistema
        const clubIdActual = window.clubId || clubId;
        let seasonIdActual = window.seasonId || seasonId;

        if (!seasonIdActual) {
            const { data: seasons } = await supabaseClient
                .from('seasons')
                .select('id')
                .eq('club_id', clubIdActual)
                .eq('is_active', true)
                .limit(1);
            if (!seasons || !seasons.length) {
                alert('No hay temporada activa. Configura una en Mi Club.');
                return;
            }
            seasonIdActual = seasons[0].id;
        }

        // Cargar jugadores de la temporada
        const { data, error } = await supabaseClient
            .from('season_players')
            .select('shirt_number, player_id, players(name, position)')
            .eq('season_id', seasonIdActual)
            .order('shirt_number', { ascending: true });

        if (error) throw error;
        ejP._plantilla = (data || []).map(sp => ({
            playerId: sp.player_id,
            number: sp.shirt_number,
            name: sp.players?.name || '?',
            position: sp.players?.position || ''
        }));
        ejRenderToolbar();
    } catch(err) {
        console.error('Error cargando plantilla:', err);
        alert('Error: ' + err.message);
    }
}

function ejColocarJugadorPlantilla(idx) {
    const p = ejP._plantilla[idx];
    if (!p) return;
    ejP._plantillaSelIdx = idx;
    ejP.activeTool = 'player';
    ejP._plantillaMode = true;
    ejRenderToolbar();
}async function ejGuardarYExportar() {
    if (!ejEditandoId) {
        alert('Guarda el ejercicio primero desde la Ficha.');
        return;
    }
    if (ejP._exportingVideo) return;
    
    // 1. Capturar miniatura limpia
    var prevSelected = ejP.selectedId;
    var prevExporting = ejP._exporting;
    ejP.selectedId = null;
    ejP._exporting = true;
    ejRenderSVG();
    var svgEl = document.getElementById('ej-svg');
    var thumbnailSvg = new XMLSerializer().serializeToString(svgEl);
    ejP.selectedId = prevSelected;
    ejP._exporting = prevExporting || false;
    ejRenderSVG();
    
    if (thumbnailSvg) {
        thumbnailSvg = thumbnailSvg.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"');
    }
    
    // 2. Guardar board_data + miniatura en Supabase
    var msgEl = document.getElementById('ej-anim-msg');
    if (msgEl) msgEl.innerHTML = '<span style="color:#3b82f6">💾 Guardando ejercicio...</span>';
    
    try {
        ejFrameSaveCurrent();
        var updateData = {
            board_data: {
                players: ejP.players, lines: ejP.lines,
                shapes: ejP.shapes, texts: ejP.texts,
                equipment: ejP.equipment,
                fieldType: ejP.fieldType,
                animFrames: ejP.frames,
                animMode: ejP.animMode
            },
            thumbnail_svg: thumbnailSvg ? ejComprimirThumbSVG(thumbnailSvg) : null
        };
        var res = await supabaseClient.from('custom_exercises').update(updateData).eq('id', ejEditandoId).select();
        if (res.error) throw res.error;
        
        // Actualizar caché
        if (res.data && res.data[0]) {
            var idx = ejBancoCache.findIndex(x => x.id === ejEditandoId);
            if (idx >= 0) ejBancoCache[idx] = { ...ejBancoCache[idx], ...res.data[0] };
        }
        
        if (msgEl) msgEl.innerHTML = '<span style="color:#22c55e">✅ Ejercicio guardado. Generando vídeo...</span>';
        
        // 3. Exportar MP4
        await ejExportarAnimacionMP4();
        
        // 4. Actualizar ficha con nuevo vídeo
        window.ejThumbnailPendiente = thumbnailSvg;
        ejPrepararThumbParaPDF();
        setTimeout(function() { ejActualizarFichaMedia(); }, 500);
        
    } catch(err) {
        if (msgEl) msgEl.innerHTML = '<span style="color:#ef4444">❌ Error: ' + err.message + '</span>';
    }
}
async function ejExportarAnimacionMP4() {
    if (!ejP.animMode || ejP.frames.length < 2) {
        alert('Activa el modo animación y crea al menos 2 frames.');
        return;
    }
    if (!ejEditandoId) {
        alert('Guarda el ejercicio primero desde la Ficha antes de exportar vídeo.');
        return;
    }

    const msg = document.getElementById('ej-anim-msg');
    ejP._exportingVideo = true; ejRenderTimeline();
    var progDiv = document.getElementById('ej-anim-msg');
    if (progDiv) progDiv.innerHTML = '<span style="color:#f97316;font-weight:600">⏳ Generando vídeo MP4... no toques nada, puede tardar hasta 1 minuto</span>';

    const svg = document.getElementById('ej-svg');
    const W = ejP.svgW;
    const H = ejP.svgH;

    // Canvas offscreen para grabar
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');

    // Configurar grabación
    const stream = canvas.captureStream(30);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
    }
    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000
    });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    // Guardar estado actual
    ejP._exporting = true;
    const savedFrame = ejP.currentFrame;
    const savedPlaying = ejP.isPlaying;
    if (savedPlaying) ejFrameStop();

    // Helper: renderizar SVG actual al canvas
    function renderSVGToCanvas() {
        return new Promise((resolve) => {
            const clone = svg.cloneNode(true);
            clone.setAttribute('width', W);
            clone.setAttribute('height', H);
            const svgData = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, W * 2, H * 2);
                ctx.drawImage(img, 0, 0, W * 2, H * 2);
                resolve();
            };
            img.onerror = () => { console.error('Error renderizando frame SVG'); resolve(); };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        });
    }

    // Iniciar grabación
    recorder.start();

    const FPS = 30;
    const frameDuration = ejP.playSpeed;
    const framesPerTransition = Math.max(8, Math.round((frameDuration / 1000) * FPS * 0.5));
    const holdFrames = 0;
    const holdMid = 0;

    for (let i = 0; i < ejP.frames.length; i++) {
        // Mostrar keyframe
        ejFrameRestore(ejP.frames[i]);
        ejP.currentFrame = i;
        ejRenderSVG();

        // Pausa solo en primer frame
        var pauseFrames = (i === 0) ? holdFrames : holdMid;
        for (let h = 0; h < pauseFrames; h++) {
            await renderSVGToCanvas();
            await new Promise(r => setTimeout(r, 1000 / FPS));
        }

        // Interpolar hacia el siguiente frame
        if (i < ejP.frames.length - 1) {
            const fA = ejP.frames[i];
            const fB = ejP.frames[i + 1];

            for (let f = 0; f <= framesPerTransition; f++) {
                const t = f / framesPerTransition;
                const ease = t * t * t * (t * (t * 6 - 15) + 10);

                // Interpolar jugadores
                for (const pa of fA.players) {
                    const pb = fB.players.find(p => p.id === pa.id);
                    const player = ejP.players.find(p => p.id === pa.id);
                    if (!pb || !player) continue;

                    const trajFree = (fA.trajectories || []).find(tr =>
                        tr.isMovement && tr.linkedId === pa.id && tr.type === 'freehand' && tr.points && tr.points.length > 1
                    );
                    const trajCurved = (fA.trajectories || []).find(tr =>
                        tr.isMovement && tr.linkedId === pa.id && tr.type === 'curved'
                    );

                    if (trajFree) {
                        const pts = trajFree.points;
                        const pos = ease * (pts.length - 1);
                        const idx = Math.min(Math.floor(pos), pts.length - 2);
                        const frac = pos - idx;
                        player.x = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
                        player.y = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;
                    } else if (trajCurved) {
                        const cx = trajCurved.cx ?? (trajCurved.x1 + trajCurved.x2) / 2;
                        const cy = trajCurved.cy ?? (trajCurved.y1 + trajCurved.y2) / 2 - 40;
                        player.x = (1-ease)*(1-ease)*trajCurved.x1 + 2*(1-ease)*ease*cx + ease*ease*trajCurved.x2;
                        player.y = (1-ease)*(1-ease)*trajCurved.y1 + 2*(1-ease)*ease*cy + ease*ease*trajCurved.y2;
                    } else {
                        player.x = pa.x + (pb.x - pa.x) * ease;
                        player.y = pa.y + (pb.y - pa.y) * ease;
                    }
                }

                // Interpolar equipamiento
                for (const ea of fA.equipment) {
                    const eb = fB.equipment.find(e => e.id === ea.id);
                    const eq = ejP.equipment.find(e => e.id === ea.id);
                    if (!eb || !eq) continue;

                    const trajFreeEq = (fA.trajectories || []).find(tr =>
                        tr.isMovement && tr.linkedId === ea.id && tr.type === 'freehand' && tr.points && tr.points.length > 1
                    );
                    const trajCurvedEq = (fA.trajectories || []).find(tr =>
                        tr.isMovement && tr.linkedId === ea.id && tr.type === 'curved'
                    );

                    if (trajFreeEq) {
                        const pts = trajFreeEq.points;
                        const pos = ease * (pts.length - 1);
                        const idx = Math.min(Math.floor(pos), pts.length - 2);
                        const frac = pos - idx;
                        eq.x = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
                        eq.y = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;
                    } else if (trajCurvedEq) {
                        const cx = trajCurvedEq.cx ?? (trajCurvedEq.x1 + trajCurvedEq.x2) / 2;
                        const cy = trajCurvedEq.cy ?? (trajCurvedEq.y1 + trajCurvedEq.y2) / 2 - 40;
                        eq.x = (1-ease)*(1-ease)*trajCurvedEq.x1 + 2*(1-ease)*ease*cx + ease*ease*trajCurvedEq.x2;
                        eq.y = (1-ease)*(1-ease)*trajCurvedEq.y1 + 2*(1-ease)*ease*cy + ease*ease*trajCurvedEq.y2;
                    } else {
                        eq.x = ea.x + (eb.x - ea.x) * ease;
                        eq.y = ea.y + (eb.y - ea.y) * ease;
                    }
                }

                ejRenderSVG();
                await renderSVGToCanvas();
                await new Promise(r => setTimeout(r, 1000 / FPS));
            }
        }
    }

    // Frame final
    await renderSVGToCanvas();
    await new Promise(r => setTimeout(r, 200));

    console.log('Animación renderizada, parando grabación...'); // Parar grabación y esperar a que termine
    recorder.onerror = (e) => { console.error('Recorder error:', e); }; const recordingDone = new Promise(resolve => { recorder.onstop = () => { console.log('Recorder parado OK'); resolve(); }; });
    recorder.stop();
    await recordingDone;

    // Restaurar estado
    ejP._exporting = false;
    ejFrameRestore(ejP.frames[savedFrame]);
    ejP.currentFrame = savedFrame;
    ejRenderSVG();
    ejRenderTimeline();

    console.log('Video generado, chunks:', chunks.length); if (msg) msg.textContent = 'Subiendo al servidor y convirtiendo a MP4...';

    const blob = new Blob(chunks, { type: 'video/webm' }); console.log('Blob creado, tamaño:', blob.size, 'bytes');
   console.log('Iniciando conversión a base64...');
    var progDiv2 = document.getElementById('ej-anim-msg');
    if (progDiv2) progDiv2.innerHTML = '<span style="color:#3b82f6;font-weight:600">📤 Subiendo al servidor y convirtiendo a MP4...</span>';
    try {
        const base64 = await new Promise((resolve, reject) => {
            const rd = new FileReader();
            rd.onload = () => { console.log('Base64 OK'); resolve(rd.result.split(',')[1]); };
            rd.onerror = () => reject(new Error('FileReader falló'));
            rd.readAsDataURL(blob);
        });
        console.log('Enviando al servidor, tamaño:', base64.length);
        const res = await fetch('https://toplidercoach.com/wp-content/uploads/ejercicios/upload-video.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer toplider_thumb_2026' },
            body: JSON.stringify({ video: base64, id: String(ejEditandoId) })
        });
        const data = await res.json();
        if (data.ok) {
            await supabaseClient.from('custom_exercises').update({ animation_url: data.url }).eq('id', ejEditandoId);
            const idx = ejBancoCache.findIndex(x => x.id === ejEditandoId);
            if (idx >= 0) ejBancoCache[idx].animation_url = data.url;
            ejP._exportingVideo = false; ejP._lastVideoUrl = data.url; ejRenderTimeline(); const msgFinal = document.getElementById('ej-anim-msg'); if (msgFinal) msgFinal.innerHTML = '✅ Vídeo MP4 guardado — <a href="' + data.url + '" target="_blank" style="color:#93c5fd;text-decoration:underline">Ver vídeo ▶</a>';
            ejP._videoDesactualizado = false;
        } else {
            ejP._exportingVideo = false; ejRenderTimeline(); const msgErr = document.getElementById('ej-anim-msg'); if (msgErr) msgErr.textContent = '❌ Error: ' + (data.error || 'desconocido');
        }
    } catch(e) {
        console.error('Error exportando:', e);
        ejP._exportingVideo = false; ejRenderTimeline(); const msgCatch = document.getElementById('ej-anim-msg'); if (msgCatch) msgCatch.textContent = '❌ Error: ' + e.message;
    }
}
function ejInit() {
    const root = document.getElementById('ejercicios-root');
    if (!root) return;

    // Extraer club/coach del contexto global si existe
    window.ejClubId  = window.currentClubId  || null;
    window.ejCoachId = window.currentCoachId || null;

    root.innerHTML = `
    <div class="ej-module">
        <!-- Sub-navegación interna -->
        <div class="ej-nav">
            <button class="ej-nav-btn active" onclick="ejShowTab('pizarra',this)">🎯 Pizarra</button>
            <button class="ej-nav-btn" onclick="ejShowTab('ficha',this)">📋 Ficha</button>
            <button class="ej-nav-btn" onclick="ejShowTab('banco',this)">🗂 Banco</button>
        </div>
        <div id="ej-tab-pizarra" class="ej-tab active">
            <div id="ej-pizarra-container"></div>
        </div>
        <div id="ej-tab-ficha" class="ej-tab" style="display:none">
            <div id="ej-ficha-container"></div>
        </div>
        <div id="ej-tab-banco" class="ej-tab" style="display:none">
            <div id="ej-banco-container"></div>
        </div>
    </div>`;

    ejBuildPizarraLayout();
    ejBuildFicha();
    ejBuildBanco();
}

function ejShowTab(tab, btn) {
    document.querySelectorAll('.ej-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.ej-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('ej-tab-' + tab).style.display = 'block';
    if (btn) btn.classList.add('active');
    if (tab === 'banco') ejBancoLoad();
}

// =============================================
// REGISTRO DEL MÓDULO
// =============================================
registrarModulo('pizarra', ejInit);
