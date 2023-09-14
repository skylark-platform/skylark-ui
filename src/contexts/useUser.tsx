import { createContext, ReactNode, useContext, useReducer } from "react";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import { getJSONFromLocalStorage } from "src/lib/utils";

type State = {
  usedLanguages: string[] | null;
};
type Action = { type: "addUsedLanguages"; value: string[] };
type Dispatch = (action: Action) => void;

type UserContextType = {
  dispatch: Dispatch;
} & State;

const UserContext = createContext<UserContextType | undefined>(undefined);

const userReducer = (state: State, action: Action) => {
  switch (action.type) {
    case "addUsedLanguages": {
      const newLanguages =
        state.usedLanguages && state.usedLanguages.length > 0
          ? action.value.filter(
              (lang) => state.usedLanguages?.indexOf(lang) === -1,
            )
          : action.value;
      if (newLanguages.length > 0) {
        const allLanguages = state.usedLanguages
          ? [...new Set([...state.usedLanguages, ...newLanguages])]
          : newLanguages;
        localStorage.setItem(
          LOCAL_STORAGE.usedLanguages,
          JSON.stringify(allLanguages),
        );
        return { ...state, usedLanguages: allLanguages };
      }
      return state;
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(userReducer, {
    usedLanguages:
      typeof window !== "undefined"
        ? getJSONFromLocalStorage<string[]>(LOCAL_STORAGE.usedLanguages)
        : [],
  });

  return (
    <UserContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
