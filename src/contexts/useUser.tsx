import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import { getJSONFromLocalStorage } from "src/lib/utils";

type State = {
  usedLanguages: string[] | null;
};
type Action = { type: "addUsedLanguages"; value: string[] };
type Dispatch = (action: Action) => void;

const UserContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
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
        localStorage.setItem(
          LOCAL_STORAGE.usedLanguages,
          JSON.stringify(newLanguages),
        );
        return { ...state, usedLanguages: newLanguages };
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
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  const { state, dispatch } = context;

  return {
    ...state,
    dispatch,
  };
};
