import enCommon from "./en/common";
import enAuth from "./en/auth";
import enCustomer from "./en/customer";
import enAdmin from "./en/admin";
import esCommon from "./es/common";
import esAuth from "./es/auth";
import esCustomer from "./es/customer";
import esAdmin from "./es/admin";
import deCommon from "./de/common";
import deAuth from "./de/auth";
import deCustomer from "./de/customer";
import deAdmin from "./de/admin";
import frCommon from "./fr/common";
import frAuth from "./fr/auth";
import frCustomer from "./fr/customer";
import frAdmin from "./fr/admin";
import itCommon from "./it/common";
import itAuth from "./it/auth";
import itCustomer from "./it/customer";
import itAdmin from "./it/admin";
import ptCommon from "./pt/common";
import ptAuth from "./pt/auth";
import ptCustomer from "./pt/customer";
import ptAdmin from "./pt/admin";

export const resources = {
  en: { common: enCommon, auth: enAuth, customer: enCustomer, admin: enAdmin },
  es: { common: esCommon, auth: esAuth, customer: esCustomer, admin: esAdmin },
  de: { common: deCommon, auth: deAuth, customer: deCustomer, admin: deAdmin },
  fr: { common: frCommon, auth: frAuth, customer: frCustomer, admin: frAdmin },
  it: { common: itCommon, auth: itAuth, customer: itCustomer, admin: itAdmin },
  pt: { common: ptCommon, auth: ptAuth, customer: ptCustomer, admin: ptAdmin },
} as const;
