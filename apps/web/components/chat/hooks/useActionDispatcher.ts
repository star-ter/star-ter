import { useMemo } from 'react';
import { type AiAction } from '../../../lib/api/ai';
import { type ChatMapSectionRef } from '../ChatMapSection';
import { ActionHandler, ActionContext } from '../actions/types';
import { MapActionHandler } from '../actions/mapActionHandler';
import { UiActionHandler } from '../actions/uiActionHandler';

export function useActionDispatcher(
  mapSectionRef: React.RefObject<ChatMapSectionRef | null>,
  setIsMapOpen: (isOpen: boolean) => void,
) {
  const handlers = useMemo<ActionHandler[]>(() => {
    return [new MapActionHandler(), new UiActionHandler()];
  }, []);

  const dispatch = (actions: AiAction[]) => {
    const context: ActionContext = {
      mapSection: mapSectionRef.current,
      openMapPanel: () => setIsMapOpen(true),
    };

    actions.forEach((action) => {
      const handler = handlers.find((h) => h.canHandle(action.type));
      if (handler) {
        try {
          handler.handle(action, context);
        } catch (error) {
          console.error(`Error handling action ${action.type}:`, error);
        }
      } else {
        console.warn(`No handler found for action type: ${action.type}`);
      }
    });
  };

  return { dispatch };
}
