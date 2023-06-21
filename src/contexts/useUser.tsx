import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import { useAccount } from "src/hooks/useAccount";
import { SkylarkAccount } from "src/interfaces/skylark/environment";
import { getJSONFromLocalStorage } from "src/lib/utils";

type State = {
  usedLanguages: string[] | null;
  defaultLanguage?: string;
};
type Action = { type: "addUsedLanguages"; value: string[] };
type Dispatch = (action: Action) => void;

const UserContext = createContext<
  { state: State; account?: SkylarkAccount; dispatch: Dispatch } | undefined
>(undefined);

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
    usedLanguages: [],
  });

  const { account } = useAccount();

  useEffect(() => {
    const usedLanguagesFromLocalStorage = getJSONFromLocalStorage<string[]>(
      LOCAL_STORAGE.usedLanguages,
    );

    dispatch({
      type: "addUsedLanguages",
      value: usedLanguagesFromLocalStorage || [],
    });
  }, []);

  return (
    <UserContext.Provider value={{ state, account, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  const { state, account, dispatch } = context;

  return {
    ...state,
    // In the future a user will have their own custom default language
    defaultLanguage: account?.defaultLanguage,
    dispatch,
  };
};
