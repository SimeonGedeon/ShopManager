// src/context/AuthContext.tsx
import React, { createContext, useContext } from "react";

interface AuthContextType {
  isAuth: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Création du contexte avec une valeur par défaut indéfinie
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Hook personnalisé pour consommer facilement le contexte partout ailleurs
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider",
    );
  }
  return context;
}
