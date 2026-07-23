import enCommon from "./en/common";
import enAuth from "./en/auth";
import enCustomer from "./en/customer";
import enAdmin from "./en/admin";
import enBranding from "./en/branding";
import esCommon from "./es/common";
import esAuth from "./es/auth";
import esCustomer from "./es/customer";
import esAdmin from "./es/admin";
import esBranding from "./es/branding";
import deCommon from "./de/common";
import deAuth from "./de/auth";
import deCustomer from "./de/customer";
import deAdmin from "./de/admin";
import deBranding from "./de/branding";
import frCommon from "./fr/common";
import frAuth from "./fr/auth";
import frCustomer from "./fr/customer";
import frAdmin from "./fr/admin";
import frBranding from "./fr/branding";
import itCommon from "./it/common";
import itAuth from "./it/auth";
import itCustomer from "./it/customer";
import itAdmin from "./it/admin";
import itBranding from "./it/branding";
import ptCommon from "./pt/common";
import ptAuth from "./pt/auth";
import ptCustomer from "./pt/customer";
import ptAdmin from "./pt/admin";
import ptBranding from "./pt/branding";

export const resources = {
  en: { common: enCommon, auth: enAuth, customer: enCustomer, admin: enAdmin, branding: enBranding },
  es: { common: esCommon, auth: esAuth, customer: esCustomer, admin: esAdmin, branding: esBranding },
  de: { common: deCommon, auth: deAuth, customer: deCustomer, admin: deAdmin, branding: deBranding },
  fr: { common: frCommon, auth: frAuth, customer: frCustomer, admin: frAdmin, branding: frBranding },
  it: { common: itCommon, auth: itAuth, customer: itCustomer, admin: itAdmin, branding: itBranding },
  pt: { common: ptCommon, auth: ptAuth, customer: ptCustomer, admin: ptAdmin, branding: ptBranding },
} as const;
