import React, { createContext, useContext, useState } from "react";

const ConfirmContext = createContext(null);
export function useConfirm() { return useContext(ConfirmContext); }

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: "", description: "", resolve: null });

  const confirm = ({ title = "Confirm", description = "" } = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, title, description, resolve });
    });
  };

  const handleClose = (result) => {
    if (state.resolve) state.resolve(result);
    setState({ open: false, title: "", description: "", resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold">{state.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{state.description}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => handleClose(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => handleClose(true)} className="px-4 py-2 bg-red-600 text-white rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
