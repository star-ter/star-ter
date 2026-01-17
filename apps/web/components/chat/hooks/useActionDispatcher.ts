import { type RefObject } from 'react';
import { type ChatMapSectionRef } from '../ChatMapSection';
import { type ActionDispatchPayload } from '../actions/commandTypes';

export function useActionDispatcher(
  mapSectionRef: RefObject<ChatMapSectionRef | null>,
  setIsMapOpen: (isOpen: boolean) => void,
) {
  const dispatch = (payload: ActionDispatchPayload) => {
    if (payload.openMapPanel) {
      setIsMapOpen(true);
    }

    if (!payload.mapCommands || payload.mapCommands.length === 0) {
      return;
    }

    if (!mapSectionRef.current) {
      console.warn('[useActionDispatcher] Map section is not ready.');
      return;
    }

    payload.mapCommands.forEach((command) => {
      try {
        mapSectionRef.current?.executeCommand(command);
      } catch (error) {
        console.error(`Error handling map command ${command.type}:`, error);
      }
    });
  };

  return { dispatch };
}
