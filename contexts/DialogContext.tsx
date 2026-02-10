import { AppDialog } from '@/components/ui/AppDialog';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export interface DialogButton {
  text: string;
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message: string;
  primaryButton: DialogButton;
  secondaryButton?: DialogButton;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    primaryButton: DialogButton;
    secondaryButton?: DialogButton;
  }>({
    visible: false,
    title: '',
    message: '',
    primaryButton: { text: 'OK' },
  });

  const hideDialog = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const showDialog = useCallback((options: DialogOptions) => {
    setState({
      visible: true,
      title: options.title,
      message: options.message,
      primaryButton: options.primaryButton,
      secondaryButton: options.secondaryButton,
    });
  }, []);

  const handlePrimaryPress = useCallback(() => {
    const onPress = state.primaryButton.onPress;
    hideDialog();
    requestAnimationFrame(() => onPress?.());
  }, [state.primaryButton, hideDialog]);

  const handleSecondaryPress = useCallback(() => {
    const onPress = state.secondaryButton?.onPress;
    hideDialog();
    requestAnimationFrame(() => onPress?.());
  }, [state.secondaryButton, hideDialog]);

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      <AppDialog
        visible={state.visible}
        onRequestClose={hideDialog}
        title={state.title}
        message={state.message}
        primaryButton={{
          text: state.primaryButton.text,
          onPress: handlePrimaryPress,
        }}
        secondaryButton={
          state.secondaryButton
            ? {
                text: state.secondaryButton.text,
                onPress: handleSecondaryPress,
              }
            : undefined
        }
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
