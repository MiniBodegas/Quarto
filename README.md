# Quarto

Portal web para gestión de clientes, inventario, facturación y administración interna.

## Características
- Acceso dual: Cliente y Administrador.
- Panel de control con resumen de facturas y saldo.
- Gestión de inventario por bodega con historial de movimientos.
- Personas autorizadas y registro de accesos.
- Módulo de facturación (pagar individual o por lote, descarga simulada).
- Administración: crear / importar clientes, ver perfiles, editar datos.
- Hook centralizado (`usePortalData`) para estado simulado (mock).
- Notificaciones (Toast).
- Estilos con Tailwind CSS.

## Stack
- Vite + React.
- Tailwind CSS.
- JavaScript (sin TypeScript en versión actual).
- Estado mediante hooks y un custom hook global.

## Requisitos
- Node.js >= 18.
- npm >= 9.

## Instalación
```bash
git clone https://github.com/MiniBodegas/Quarto.git
cd Quarto
npm install
npm run dev
```

## Scripts
```bash
npm run dev        # Desarrollo
npm run build      # Producción
npm run preview    # Servir build
```

## Estructura
```
src/
  App.jsx
  main.jsx
  Hooks/usePortalData.js
  Components/
    index.js
    Auth.jsx
    Portal.jsx
    AdminPanel.jsx
    AdminLogin.jsx
    Invoices.jsx
    Inventory.jsx
    AccountStatement.jsx
    ...
    ui/
      Card.jsx
      Button.jsx
      Input.jsx
      Modal.jsx
      Spinner.jsx
      Toast.jsx
  data/mockData.js
  utils/
    formatters.js
    constants.js
index.css
tailwind.config.js
```

## Tailwind
Asegúrate:
```js
// tailwind.config.js
export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: { extend: { colors: { primary: "#074BED" } } },
  plugins: [],
}
```
```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Variables de Entorno (opcional)
Crear `.env` si se agregan servicios reales:
```
VITE_API_BASE_URL=https://api.ejemplo.com
VITE_FEATURE_AUTO_PAY=true
```

## Hook Principal
`usePortalData` centraliza:
- Sesión
- Perfiles
- Inventarios
- Facturas
- Accesos
- Notificaciones
Todas las operaciones son simuladas (timeouts).

## Flujo Básico
1. Usuario selecciona cliente y credencial.
2. Se carga `Portal` con vistas: dashboard, inventario, facturas, etc.
3. Admin usa login especial y accede a `AdminPanel`.

## Extensión Fácil
- Reemplazar `mockData.js` por llamadas reales (fetch/axios).
- Sustituir notificaciones por librería externa si se requiere.
- Añadir persistencia en localStorage / API.

## Convenciones
- Componentes en PascalCase.
- Funciones y hooks en camelCase.
- Mocks con prefijo `mock`.

## Troubleshooting
| Problema | Solución |
|----------|----------|
| Clases Tailwind no aplican | Verificar `content` en `tailwind.config.js`, reiniciar `npm run dev`. |
| Error exportación | Confirmar `Components/index.js` y uso de llaves en import. |
| Estado no se actualiza | Revisar dependencias en `useCallback` / `useMemo`. |
| Conflicto git al hacer push | Hacer `git pull --rebase origin main`, resolver README y continuar. |

## Futuras Mejoras
- Autenticación real (JWT).
- Persistencia en base de datos.
- Control de roles granular.
- Tests unitarios y e2e.
- Internacionalización.

## Contribuir
1. Fork.
2. Rama: `feat/nueva-funcionalidad`.
3. Pull Request descriptivo.

## Licencia
Definir (MIT / Propietario). Añadir archivo LICENSE si aplica.

---
Desarrollado para MiniBodegas como base operativa de portal de clientes.