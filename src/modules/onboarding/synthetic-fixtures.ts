/**
 * YOURMEAL OS — SYNTHETIC ONBOARDING TEST FIXTURES
 *
 * Synthetic, non-real test datasets representing a fictional catering business:
 * "VerdeOliva Catering SL" (Madrid).
 *
 * Used exclusively for testing extraction, semantic mapping, normalization,
 * validation, deduplication, and reconciliation without touching real client data.
 */

export interface SyntheticCustomerRow {
  "Nombre Completo": string;
  "Correo Electronico": string;
  "Telefono": string;
  "Empresa": string;
  "Direccion Entrega": string;
  "Codigo Postal": string;
  "Ciudad": string;
  "Alergias / Preferencias": string;
}

export const SYNTHETIC_CUSTOMERS_FIXTURE: SyntheticCustomerRow[] = [
  {
    "Nombre Completo": "Carlos Mendoza Ruiz",
    "Correo Electronico": "carlos.mendoza@techacme.es",
    "Telefono": "612345678",
    "Empresa": "TechAcme Solutions SL",
    "Direccion Entrega": "Calle Gran Vía 28, Planta 4",
    "Codigo Postal": "28013",
    "Ciudad": "Madrid",
    "Alergias / Preferencias": "Sin gluten",
  },
  {
    "Nombre Completo": "Laura Gómez Serrano",
    "Correo Electronico": "laura.gomez@consultingbeta.com",
    "Telefono": "+34 622 987 654",
    "Empresa": "Consulting Beta SL",
    "Direccion Entrega": "Paseo de la Castellana 110",
    "Codigo Postal": "28046",
    "Ciudad": "Madrid",
    "Alergias / Preferencias": "Vegetariano (sin lactosa)",
  },
  {
    "Nombre Completo": "David Fernández",
    "Correo Electronico": "david.f@techacme.es",
    "Telefono": "633 11 22 33",
    "Empresa": "TechAcme Solutions SL",
    "Direccion Entrega": "Calle Gran Vía 28, Planta 4",
    "Codigo Postal": "28013",
    "Ciudad": "Madrid",
    "Alergias / Preferencias": "Ninguna",
  },
  {
    // Potential fuzzy duplicate of Carlos Mendoza
    "Nombre Completo": "Carlos Mendoza R.",
    "Correo Electronico": "carlos.mendoza@techacme.es",
    "Telefono": "612345678",
    "Empresa": "TechAcme",
    "Direccion Entrega": "Gran Vía 28",
    "Codigo Postal": "28013",
    "Ciudad": "Madrid",
    "Alergias / Preferencias": "Celiaco",
  },
  {
    // Invalid row (Malformed email & impossible phone) for validation testing
    "Nombre Completo": "Marta Invalida",
    "Correo Electronico": "marta.invalida-email-sin-arroba",
    "Telefono": "12345",
    "Empresa": "",
    "Direccion Entrega": "",
    "Codigo Postal": "",
    "Ciudad": "",
    "Alergias / Preferencias": "",
  },
];

export const SYNTHETIC_DISHES_FIXTURE = [
  {
    "Nombre Plato": "Pollo al Curry con Arroz Basmati",
    "Categoria": "Plato Principal",
    "Alergenos": "Ninguno",
    "Kcal": 520,
  },
  {
    "Nombre Plato": "Lasaña Vegetal de Calabacín",
    "Categoria": "Vegetariano",
    "Alergenos": "Lácteos",
    "Kcal": 440,
  },
  {
    "Nombre Plato": "Salmón al Horno con Verduras Asadas",
    "Categoria": "Pescado",
    "Alergenos": "Pescado",
    "Kcal": 480,
  },
];
