// Roles con acceso a cada sección (nombres tal como figuran en la tabla roles).
// Sprint 4 - HU09 a HU12: la Secretaria gestiona las cobranzas, la Coordinadora
// Administrativa las consulta y la Directora tiene acceso total.
export const ROLES_COBRANZAS = ['Secretaria', 'Coordinadora Administrativa', 'Directora'];
export const ROLES_GESTION_COBRANZAS = ['Secretaria', 'Directora'];

// Sprint 5 - HU13: el listado de alumnos con estado de cuota lo consultan los mismos roles que Cobranzas.
export const ROLES_ALUMNOS = ROLES_COBRANZAS;
// Sprint 5 - HU14: el informe de recaudación es para la Directora y la Coordinadora Administrativa.
export const ROLES_INFORMES = ['Directora', 'Coordinadora Administrativa'];
