import React, { createContext, useContext, useState, ReactNode } from "react";

interface CategoriesContextType {
    categories: string[];
    setCategories: (categories: string[]) => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<string[]>([]);

    return (
        <CategoriesContext.Provider value={{ categories, setCategories }}>
            {children}
        </CategoriesContext.Provider>
    );
}

export function useCategoriesContext() {
    const context = useContext(CategoriesContext);
    if (context === undefined) {
        throw new Error("useCategoriesContext must be used within a CategoriesProvider");
    }
    return context;
}
